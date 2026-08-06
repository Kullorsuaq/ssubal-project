const axios = require("axios"); 
const pool = require("../config/database");
const { sendPushNotification } = require("../utils");

const getPosts = async (req, res) => {
  const no = parseInt(req.query.no) || 1;
  const keyword = req.query.keyword;
  const limit = parseInt(req.query.limit) || null;
  const userId = req.query.userId;
  const { groupId } = req.params;

  const offset = limit ? (no - 1) * limit : null;

  let queryStr = `select p.* from substitute_posts p join group_participants gp on p.writer_id = gp.id where gp.group_id = ?`;
  let countStr = `select count(*) as total from substitute_posts p join group_participants gp on p.writer_id = gp.id where gp.group_id = ?`;

  let queryParams = [groupId];
  let countParams = [groupId];

  try {
    
    if(keyword && keyword.trim() !== '') {
      const searchPattern = `%${keyword}%`;

      queryStr += " and p.title like ?";
      countStr += " and p.title like ?";

      queryParams.push(searchPattern);
      countParams.push(searchPattern);
    } 

    if(userId) {
      queryStr += " and gp.user_id = ?";
      countStr += " and gp.user_id = ?";

      queryParams.push(userId);
      countParams.push(userId);
    }

    queryStr += " order by created_at desc";

    if(limit) {
      queryStr += " limit ? offset ?";

      queryParams.push(limit, offset);
    }

    const [postRows] = await pool.query(queryStr, queryParams);
    const [totalRows] = await pool.query(countStr, countParams);

    return res.status(200).json({
      code: "GET_POSTS_SUCCESS",
      total: totalRows[0].total,
      data: postRows
    });
  } catch(err) {
    return res.status(500).json({code: "SERVER_ERROR", message: "서버 에러"});
  }
}

const getPostDetail = async (req, res) => {
  const { postId } = req.params;
  const participantId = req.participantId;

  try {
    const postQuery = `
      select
        p.*,
        p.writer_id as participant_id,
        u.id as writer_id,
        u.name as writer_name,
        u.img_url as profile_img
      from substitute_posts p
      join group_participants gp on p.writer_id = gp.id
      join users u on gp.user_id = u.id
      where p.id = ?
    `;

    const [postRows] = await pool.query(postQuery, [postId]);

    if(postRows.length === 0) {
      return res.status(404).json({code: "POST_NOT_FOUND", message: "존재하지 않거나 삭제된 게시글"});
    }

    const applicantsQuery = `
      select 
        sa.id as id,
        sa.status as status,
        sa.applicant_id as participant_id,
        u.id as applicant_id, 
        u.name as applicant_name, 
        u.img_url as applicant_profile_img
      from substitute_applicants sa
      join group_participants gp on sa.applicant_id = gp.id
      join users u on gp.user_id = u.id
      where sa.post_id = ?
      order by sa.created_at asc
    `;
    
    const [applicantRows] = await pool.query(applicantsQuery, [postId]);

    const commentsQuery = `
      select 
        c.id as comment_id, 
        c.content as comment_content, 
        c.\`start\` as comment_start, 
        c.created_at as created_at, 
        u.id as comment_writer_id, 
        u.name as comment_writer_name, 
        u.img_url as comment_writer_profile_img
      from substitute_comments c 
      join group_participants gp on c.writer_id = gp.id
      join users u on gp.user_id = u.id
      where c.post_id = ?
      order by coalesce(c.\`start\`, c.id) asc, c.id asc;
    `

    const [commentRows] = await pool.query(commentsQuery, [postId]);

    const isWriter = postRows[0].participant_id === participantId;
    //현재 로그인한 유저가 지원자에 있는지
    const isApplied = applicantRows.some(applicant => applicant.participant_id === participantId);

    res.status(200).json({
      post: postRows[0],
      applicants: applicantRows,
      comments: commentRows,
      isWriter,
      isApplied
    });
  } catch(error) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

const createPost = async (req, res) => {
  const { groupId } = req.params;
  const writerId = req.participantId; 
  const { title, date, startTime, endTime, wage, content } = req.body;

  try {
    const [result] = await pool.query('insert into substitute_posts_data (writer_id, title, content, date, start_time, end_time, wage) values (?, ?, ?, ?, ?, ?, ?)',
      [writerId, title, content, date, startTime, endTime, wage]
    );

    const newPostId = result.insertId;

    res.status(201).json({ 
    code: "POST_CREATED_SUCCESS", 
    message: "글 등록 성공", 
    data: {
      post_id: newPostId
    }});
  } catch(error) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }

}

const editPost = async (req, res) => {
  const { id } = req.user;
  const { postId } = req.params;
  const writerId = req.participantId;
  const { title, date, startTime, endTime, content, wage } = req.body;

  try {
    const [postRows] = await pool.query(
      'select * from substitute_posts where id = ?',
      [postId]
    );

    if (postRows.length === 0) {
      return res.status(404).json({
        code: "POST_NOT_FOUND",
        message: "존재하지 않거나 이미 삭제된 글"
      });
    }

    if(postRows[0].writer_id !== writerId){
      return res.status(403).json({
        code: "NOT_POST_WRITER",
        message: "본인이 작성한 글이 아님"
      });
    }

    await pool.query(
      `update substitute_posts set title = ?, content = ?, date = ?, start_time = ?, end_time = ?, wage = ? where id = ?`,
      [title, content, date, startTime, endTime, wage, postId]
    );

    res.status(200).json({ code: "POST_UPDATED_SUCCESS", message: "글 수정 성공" });
  } catch(error) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

const deletePost = async (req, res) => {
  const { postId } = req.params;
  const writerId = req.participantId;

  try {
    const [postRows] = await pool.query(
      'select writer_id from substitute_posts where id = ?',
      [postId]
    );

    if (postRows.length === 0) {
      return res.status(404).json({
        code: "POST_NOT_FOUND",
        message: "존재하지 않거나 이미 삭제된 글"
      });
    }

    if(postRows[0].writer_id !== writerId){
      return res.status(403).json({
        code: "NOT_POST_WRITER",
        message: "본인이 작성한 글이 아님"
      });
    }

    await pool.query(`
      delete from substitute_posts where id = ?;
    `, [postId]);

    res.status(200).json({ code: "POST_DELETED_SUCCESS", message: "글 삭제 완료" });
  } catch(error) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

const createComment = async (req, res) => {
  const { id } = req.user;
  const { groupId, postId } = req.params;
  const writerId = req.participantId;
  const { parentCommentId, content } = req.body;

  let connection;

  try {
    connection = await pool.getConnection();

    await connection.beginTransaction();

    const [result] = await connection.query(`
      insert into substitute_comments (writer_id, post_id, content, \`start\`) values (?, ?, ?, ?)
    `, [writerId, postId, content, parentCommentId]);

    const commentsQuery = `
      select 
        c.id as comment_id, 
        c.content as comment_content, 
        c.\`start\` as comment_start, 
        c.created_at as created_at, 
        u.id as comment_writer_id, 
        u.name as comment_writer_name, 
        u.img_url as comment_writer_profile_img
      from substitute_comments c 
      join group_participants gp on c.writer_id = gp.id
      join users u on gp.user_id = u.id
      where c.post_id = ?
      order by coalesce(c.\`start\`, c.id) asc, c.id asc;
    `;

    const [commentRows] = await connection.query(commentsQuery, [postId]);

    const newComment = commentRows.filter(comment => comment.comment_id === result.insertId)[0];

    const [postRows] = await connection.query(
      `select p.writer_id, p.title, u.id, u.push_token 
      from substitute_posts_data p
      join group_participants gp on p.writer_id = gp.id
      join users u on gp.user_id = u.id
      where p.id = ?`,
      [postId]
    );

    //푸시 알림 실패가 DB 댓글 생성을 취소시킬 필요는 없으므로, 커밋 후 처리
    const postOwner = postRows[0];

    let notiId;

    if(postOwner.writer_id !== writerId) {
      const receiverId = postOwner.id;  
      
      const metadata = { postId: postId, postTitle: postRows[0].title, writerName: newComment.comment_writer_name, commentContent: newComment.comment_content };

      const [notiResult] = await connection.query(`
        insert into notifications (group_id, sender_id, receiver_id, type, metadata) values (?, ?, ?, ?, ?)
      `, [groupId, id, receiverId, 'NEW_COMMENT', JSON.stringify(metadata)]); //metadata(객체) -> 문자열화

      notiId = notiResult.insertId;
    }

    await connection.commit();

    if(postOwner && postOwner.push_token && postOwner.writer_id !== writerId) {
      const pushTitle = `새로운 댓글이 달렸습니다. - ${postRows[0].title}`;
      const pushBody = `${newComment.comment_writer_name}님: ${content.length > 20 ? content.substring(0, 20) + '...' : content}`;
      const pushData = { postId: postId, groupId: groupId, notiId: notiId, type: 'NEW_COMMENT' };

      //푸시 함수는 배열을 받으므로 배열로
      const pushTokens = [postOwner.push_token];

      await sendPushNotification(pushTokens, pushTitle, pushBody, pushData);
    }

    return res.status(201).json({
      code: "COMMENT_CREATED_SUCCESS",
      message: "댓글 등록 완료",
      data: commentRows,
      newComment: newComment
    });
  } catch(error) {
    console.error(error);
    if (connection) {
      await connection.rollback();
    }
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  } finally {
    if(connection) {
      connection.release();
    }
  }
}

const deleteComment = async (req, res) => {
  const { postId, commentId } = req.params;
  const writerId = req.participantId;

  try {
    const [commentRows] = await pool.query(
      'select writer_id from substitute_comments where id = ?',
      [commentId]
    );

    if (commentRows.length === 0) {
      return res.status(404).json({
        code: "COMMENT_NOT_FOUND",
        message: "존재하지 않거나 이미 삭제된 댓글"
      });
    }

    if(commentRows[0].writer_id !== writerId){
      return res.status(403).json({
        code: "NOT_COMMENT_WRITER",
        message: "본인이 작성한 댓글이 아님"
      });
    }

    await pool.query(`
      delete from substitute_comments where id = ? or \`start\` = ?;
    `, [commentId, commentId]);

    const commentsQuery = `
      select 
        c.id as comment_id, 
        c.content as comment_content, 
        c.\`start\` as comment_start, 
        c.created_at as created_at, 
        u.id as comment_writer_id, 
        u.name as comment_writer_name, 
        u.img_url as comment_writer_profile_img
      from substitute_comments c 
      join group_participants gp on c.writer_id = gp.id
      join users u on gp.user_id = u.id
      where c.post_id = ?
      order by coalesce(c.\`start\`, c.id) asc, c.id asc;
    `

    const [updatedCommentRows] = await pool.query(commentsQuery, [postId]);

    res.status(200).json({
      code: "COMMENT_DELETED_SUCCESS",
      message: "댓글 삭제 완료",
      data: updatedCommentRows
    });
  } catch(error) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

module.exports = {
  getPosts,
  getPostDetail,
  createPost,
  editPost,
  deletePost,
  createComment,
  deleteComment
}