const pool = require("../config/database");

const checkGroupAccess = async (req, res, next) => {
  const { id } = req.user;
  const { groupId } = req.params;
  const { password } = req.body;

  try {
    const [groupRows] = await pool.query("select * from group_lists where id = ?", [groupId]);
    if (groupRows.length === 0) {
      return res.status(404).json({ code: "GROUP_NOT_FOUND", message: "존재하지 않는 그룹" });
    }

    const [existingParticipant] = await pool.query(
      "select * from group_participants where group_id = ? and user_id = ?",
      [groupId, id]
    );
    if (existingParticipant.length > 0) {
      return res.status(400).json({ code: "ALREADY_JOINED", message: "이미 그룹에 가입된 사용자" });
    }

    if (groupRows[0].password !== password) {
      return res.status(401).json({ code: "INVALID_GROUP_PASSWORD", message: "그룹 비밀번호 틀림" });
    }

    //일단 req 객체에 담아서 컨트롤러로 넘겨줌
    req.group = groupRows[0];
    next();
  } catch (err) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

const checkGroupMember = async (req, res, next) => {
  const { id } = req.user;
  const { groupId } = req.params;

  try {
    const [participantRows] = await pool.query(`
      select id from group_participants where group_id = ? and user_id = ?   
    `, [groupId, id]);
    
    if(participantRows.length === 0) {
      return res.status(403).json({ code: "NOT_GROUP_MEMBER", message: "그룹 멤버 아님" });
    }

    req.participantId = participantRows[0].id;

    next();
  } catch(error) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

const checkAdminOrOwner = async (req, res, next) => {
  const { id } = req.user;
  const { groupId } = req.params;

  try {
    const [participantRows] = await pool.query(
      "select role from group_participants where user_id = ? and group_id = ?", [id, groupId]
    );

    const participant = participantRows[0];

    if(!participant || (participant.role !== 'OWNER' && participant.role !== 'ADMIN')) {
      return res.status(403).json({ code: "UNAUTHORIZED_ACCESS", message: "관리자 또는 그룹장만 접근 가능" });
    }

    next();
  } catch(error) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

module.exports = {
  checkGroupAccess,
  checkGroupMember,
  checkAdminOrOwner
}