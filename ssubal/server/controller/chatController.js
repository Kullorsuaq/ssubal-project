const axios = require("axios");
const pool = require("../config/database");

const getOrCreateChatRoom = async (req, res) => {
  const { id } = req.user;
  const { groupId } = req.params;  
  const { targetId } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRoom] = await connection.query(`
      select cp1.room_id
      from chat_participants cp1
      join chat_participants cp2 on cp1.room_id = cp2.room_id
      join chat_rooms cr on cp1.room_id = cr.id
      where cp1.user_id = ?
        and cp2.user_id = ?
        and cr.group_id = ?
      limit 1
    `, [id, targetId, groupId]);

    if(existingRoom.length > 0) {
      const roomId = existingRoom[0].room_id;
      return res.status(200).json({
        code: "FIND_CHATROOM_SUCCESS",
        roomId: roomId
      });
    }

    const [roomResult] = await connection.query(`
      insert into chat_rooms (group_id) values (?)  
    `, [groupId]);

    const newRoomId = roomResult.insertId;

    await connection.query(
      `insert into chat_participants (room_id, user_id) values (?, ?), (?, ?)`,
      [newRoomId, id, newRoomId, targetId]
    );

    await connection.commit();

    return res.status(201).json({
      code: "CREATE_CHATROOM_SUCCESS",
      roomId: newRoomId 
    })
  } catch(error) {
    await connection.rollback();
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러"});
  } finally {
    connection.release();
  }
}

const getMessages = async (req, res) => {
  const { groupId, roomId } = req.params;

  try {
    const [conversationRows] = await pool.query(`
      select cc.id, cc.sender_id, cc.content, cc.created_at, u.id as user_id, u.name as user_name, u.img_url 
      from chat_conversations cc 
      join users u on u.id = cc.sender_id 
      join chat_rooms cr on cr.id = cc.room_id
      where cr.group_id = ? and cc.room_id = ? 
      order by cc.created_at asc;
    `, [groupId, roomId]);

    res.status(200).json({ code: "GET_CONVERSATIONS_SUCCESS", data: conversationRows });
  } catch(error) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러"});
    console.error(error);
  }
}

const getAllChats = async (req, res) => {
  const { id } = req.user;
  const { groupId } = req.params;
  
  try {
    const [chatRows] = await pool.query(`
      select
        cp.room_id,
        cp.last_read_chat_id,
        rc.last_message_id,
        rc.last_message_content,
        rc.last_message_time,
        rc.sender_name,
        target_u.id as target_user_id,
        target_u.name as target_user_name,
        target_u.img_url as target_user_img_url
      from chat_participants cp
      join chat_rooms cr on cp.room_id = cr.id
      join chat_participants target_cp on cp.room_id = target_cp.room_id and target_cp.user_id != ?
      join users target_u on target_cp.user_id = target_u.id
      left join (
        select
          cc.room_id,
          cc.id as last_message_id,
          cc.sender_id,
          cc.content as last_message_content,
          cc.created_at as last_message_time,
          u.name as sender_name,
          row_number() over (
            partition by cc.room_id
            order by cc.created_at desc, cc.id desc
          ) as rn
        from chat_conversations cc
        left join users u on cc.sender_id = u.id
      ) rc on cp.room_id = rc.room_id and rc.rn = 1
      where cp.user_id = ? and cr.group_id = ?
      order by rc.last_message_time desc;
    `, [id, id, groupId]);
    res.status(200).json({ code: "GET_ALL_CHATS_SUCCESS", data: chatRows });
  } catch(error) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러"});
  }
}

const setLastReadChatId = async (req, res) => {
  const { id } = req.user;
  const { roomId } = req.params;
  const { chatId } = req.body;

  try {
    await pool.query(`
      update chat_participants set last_read_chat_id = ? where room_id = ? and user_id = ?
    `, [chatId, roomId, id]);

    res.status(200).json({ code: "SET_LAST_READ_CHAT" })
  } catch(error) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러"});
  }
}

module.exports = {
  getOrCreateChatRoom,
  getMessages,
  getAllChats,
  setLastReadChatId
};