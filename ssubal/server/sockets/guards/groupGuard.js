const pool = require("../../config/database");

const checkGroupMember = async (socket, next) => {
  const { userId, groupId } = socket;

  try {
    const [participantRows] = await pool.query(`
      select id from group_participants where group_id = ? and user_id = ?   
    `, [groupId, userId]);
    
    if(participantRows.length === 0) {
      const error = new Error("그룹 멤버 아님");
      error.data = { status: 403, code: "NOT_GROUP_MEMBER" };
      return next(error);
    }

    socket.join(`group_${groupId}`);

    socket.participantId = participantRows[0].id;

    next();
  } catch(err) {
    const error = new Error("서버 에러");
    error.data = { status: 500, code: "SERVER_ERROR" };
    return next(error);  
  }
}

module.exports = {
  checkGroupMember,
}