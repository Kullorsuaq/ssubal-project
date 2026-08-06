const pool = require("../../config/database");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkGroupMember } = require("../guards/groupGuard");

function chatHandler(chatIo) {
  //처음 연결될 땐 전역에서 소켓을 사용할 수 있도록 해야 하기 때문에 groupId가 필요한 checkGroupMember를 하지 않음
  chatIo.use(verifyToken);
  chatIo.use(checkGroupMember);

  chatIo.on('connection', socket => {
    const id = socket.userId;
    socket.join(`user_${id}`);

    //방에 들어갔을 때 참여하지 않았으면 참여시키기(방에 들어갔을 때만 참여시키기, 알림은 방에X, 유저에O)
    socket.on('join_room', async (roomId) => {
      if(!socket.rooms.has(roomId)) {
        await socket.join(roomId);
      }
    });

    socket.on('send_message', async (roomId, groupId, message) => {      
      let chat;
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();
        const [chatResult] = await connection.query(`
          insert into chat_conversations (room_id, sender_id, content) values (?, ?, ?)
        `, [roomId, id, message]);

        const chatId = chatResult.insertId;

        const [chatRows] = await connection.query(`
          select cc.id, cc.sender_id, cc.content, cc.created_at, u.id as user_id, u.name as user_name, u.img_url
          from chat_conversations cc
          join users u on u.id = cc.sender_id
          join chat_rooms cr on cr.id = cc.room_id
          where cc.id = ?
        `, [chatId]);

        const [participantRows] = await connection.query(`
          select user_id from chat_participants where room_id = ?
        `, [roomId]);

        await connection.commit();

        if(participantRows.length > 0) {
          participantRows.forEach(participant => {
            chatIo.to(`user_${participant.user_id}`).emit('receive_message', chatRows[0], roomId, chatId);
          })
        }
      } catch(error) {
        await connection.rollback();
        socket.emit('chat_error', { status: 500, code: "SERVER_ERROR", message: "서버 에러" });
      } finally {
        connection.release();
      }
    });

    socket.on('leave_room', async (roomId) => {
      if (socket.rooms.has(roomId)) {
        await socket.leave(roomId); //소켓 서버 채널(Room)에서 강제 퇴장 처리
      }
    })
  })
}

module.exports = chatHandler;