const axios = require("axios"); 
const pool = require("../config/database");

const getProfile = async (req, res) => {
  //나중에 유저가 그룹별 포지션을 사용할 때를 위해(확장)
  const { groupId, userId } = req.params;

  try {
    const [profileRows] = await pool.query(`
      select id as user_id, name as user_name, img_url, description from users where id = ?
    `, [userId]);

    if(profileRows) {
      res.status(200).json({ 
        code: "GET_PROFILE_SUCCESS", 
        profile: profileRows[0]
      });
    }
  } catch(error) {
    res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

const editProfile = async (req, res) => {
  const { userId, groupId } = req.params;

  const newDescription = req.body.description;
  let newImgUrl = null;
  if(req.file) {
    newImgUrl = `/uploads/${req.file.filename}`;
  }
  try {
    const fields = ['description = ?'];
    const params = [newDescription];

    if(newImgUrl) {
      fields.push('img_url = ?');
      params.push(newImgUrl);
    }

    params.push(userId);

    const query = `update users set ${fields.join(', ')} where id = ?`;
    await pool.query(query, params);
    

    const [profileRows] = await pool.query(`
      select id as user_id, name as user_name, img_url, description from users where id = ?
    `, [userId]);

    res.status(200).json({ code: "EDIT_PROFILE_SUCCESS", profile: profileRows[0] });
  } catch(error) {
    res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

module.exports = {
  getProfile, 
  editProfile
}