const axios = require("axios"); 
const pool = require("../config/database");

const getGroups = async (req, res) => {
  const no = parseInt(req.query.no) || 1;
  const keyword = req.query.keyword;

  let queryStr = "select * from group_lists";
  let countStr = "select count(*) as total from group_lists";

  const limit = 10;
  const offset = (no - 1) * 10;

  try {
    let queryParams = [];
    let countParams = [];

    if(keyword && keyword.trim() !== '') {
      const searchPattern = `%${keyword}%`;

      queryStr += " where name like ?";
      countStr += " where name like ?";

      queryParams.push(searchPattern);
      countParams.push(searchPattern);
    } 

    queryStr += " order by created_at desc limit ? offset ?";

    queryParams.push(limit, offset);

    const [groupRows] = await pool.query(queryStr, queryParams);
    const [totalRows] = await pool.query(countStr, countParams);

    return res.status(200).json({
      total: totalRows[0].total,
      data: groupRows
    });
  } catch(err) {
    return res.status(500).json({code: "SERVER_ERROR", message: "서버 에러"});
  }
}

const verifyGroupPassword = async (req, res) => {
  //가드를 거치기 때문에 도달했다는 것 자체가 비밀번호가 맞고 그룹 가입 안 한 유저라는 뜻 
  return res.status(200).json({code: "RIGHT_PASSWORD", message: "비밀번호 검증 성공"});
}

const groupSignup = async (req, res) => {
  const userId = req.user.id; //미들웨어에서 온 것
  const { groupId } = req.params; 
  const { startDate } = req.body;

  const formattedDate = new Date(startDate);

  try {
    await pool.query(
      "insert into group_participants (group_id, user_id, start_date) values (?, ?, ?)",
      [groupId, userId, formattedDate]
    );

    return res.status(200).json({ code: "SIGNUP_SUCCESS", message: "그룹 가입 성공"});
  } catch(err) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

const createGroup = async (req, res) => {
  const { userId, groupName, description, password, color, positionList } = req.body;

  //DB 커넥션 하나 빌려오기(트랜잭션을 쓰려면 하나의 커넥션으로 통일해야 함)
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction(); 

    const [existingGroup] = await connection.query(
      `select id from group_lists where name = ?`, [groupName]
    )

    if(existingGroup.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ code: "DUPLICATE_NAME", message: "이미 존재하는 그룹 이름" });
    }

    const [result] = await connection.query(
      `insert into group_lists(name, password, description, theme_color)
      values (?, ?, ?, ?)`,
      [groupName, password, description, color]
    );  

    const newGroupId = result.insertId;

    const refinedPositionList = positionList.map(pos => [
      newGroupId,
      pos.workName,
      pos.startTime,
      pos.endTime,
      pos.wage
    ]);

    //group_positions에 그룹 포지션 추가하기
    //mysql2 패키지는 이중 배열을 넣으면 알아서 bulk 포맷으로 바꿔줌
    if(refinedPositionList && refinedPositionList.length > 0) {
      await connection.query(`insert into group_positions (group_id, position, start_time, end_time, wage) values ?`, [refinedPositionList]);
    }

    //group_participants에 role admin으로 추가하기
    await connection.query(`insert into group_participants (group_id, user_id, role) values (?, ?, ?)`, [newGroupId, userId, 'OWNER']);

    await connection.commit();

    const [newGroupRows] = await pool.query(
      `
      select
        g.id as group_id,
        g.name as group_name,
        g.theme_color,
        g.description,
        g.created_at,
        p.role
      from group_participants p
      join group_lists g
      on p.group_id = g.id
      where g.id = ? and p.user_id = ?
      `,
      [newGroupId, userId]
    );

    res.status(201).json({ 
      code: "REGISTER_SUCCESS", 
      message: "그룹 등록 성공", 
      data: newGroupRows[0]
    });

  } catch(error) {
    await connection.rollback();

    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  } finally {
    connection.release();
  }
}

const getGroupParticipants = async (req, res) => {
  const { groupId } = req.params; 

  try {
    const [participantRows] = await pool.query(
      `select 
        p.user_id, u.name, u.img_url, p.id as participant_id 
        from group_participants p
        join users u on p.user_id = u.id 
        where p.group_id = ?`, 
      [groupId]
    );

    return res.status(200).json({ code: "FETCH_PARTICIPANTS_SUCCESS", data: participantRows });
  } catch(error) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

module.exports = {
  getGroups,
  verifyGroupPassword,
  groupSignup,
  createGroup,
  getGroupParticipants
};