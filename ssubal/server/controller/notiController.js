const axios = require("axios"); 
const pool = require("../config/database");

const getNotifications = async (req, res) => {
  const { id } = req.user;
  const { groupId } = req.params;

  try {
    const [notiRows] = await pool.query(`
      select id, sender_id, type, is_read, metadata, created_at from notifications where group_id = ? and receiver_id = ? order by created_at
    `, [groupId, id]);

    res.status(200).json({
      code: "GET_NOTIFICATIONS_SUCCESS",
      notifications : notiRows
    });
  } catch(error) {
    res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

const patchNotificationRead = async (req, res) => {
  const { groupId, notificationId } = req.params;

  try {
    await pool.query(`
      update notifications set is_read = 1 where id = ?
    `, [notificationId]);

    res.status(200).json({ ok: true });
  } catch(error) {
    res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

module.exports = {
  getNotifications,
  patchNotificationRead
}