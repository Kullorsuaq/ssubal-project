const pool = require("../config/database");

const checkChatParticipant = async (req, res, next) => {
  const { id } = req.user;
  const { roomId } = req.params;

  try {
    const [participantRows] = await pool.query(`
      select 1 from chat_participants where room_id = ? and user_id = ? limit 1   
    `, [roomId, id]);
    
    if(participantRows.length === 0) {
      return res.status(403).json({ code: "NOT_CHAT_MEMBER", message: "채팅 멤버 아님" });
    }

    next();
  } catch(error) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

module.exports = {
  checkChatParticipant
}