const axios = require("axios");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const cookieOptions = {
  secure: true,
  httpOnly: true,
  sameSite: "none",
  path: "/"
};

const kakaoLogin = async (req, res) => {
  try {
    const { code } = req.body;

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("client_id", process.env.KAKAO_CLIENT_ID);
    params.append("redirect_uri", process.env.REDIRECT_URI);
    params.append("code", code);
    params.append("client_secret", process.env.KAKAO_SECRET_KEY);

    const tokenResponse = await axios({
      url: "https://kauth.kakao.com/oauth/token",
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      data: params.toString()
    });

    const kakaoAccessToken = tokenResponse.data.access_token;

    const userResponse = await axios({
      url: "https://kapi.kakao.com/v2/user/me",
      method: "post",
      headers: {
        Authorization: `Bearer ${kakaoAccessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      }
    });

    const userId = userResponse.data.id;

    const [userRows] = await pool.query(
      "select * from users where provider_id = ? and provider = ?",
      [userId, "kakao"]
    );

    const userInfo = userRows[0];
    console.log('userId', userId);
    console.log('userRows', userRows);
    console.log('userInfo', userInfo)

    if (!userInfo) {
      res.cookie(
        "temp_info",
        JSON.stringify({
          provider: "kakao",
          userId
        }),
        {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 60000,
          path: "/"
        }
      );

      return res.status(403).json({
        code: "NEED_SIGNUP",
        message: "회원가입 필요"
      });
    }

    const [groupRows] = await pool.query(
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
      where p.user_id = ?
      `,
      [userInfo.id]
    );

    const groupIds = groupRows.map(group => group.group_id);

    const tokenPayload = {
      id: userInfo.id,
      provider: "kakao",
      name: userInfo.name,
      groupIds
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.ACCESS_SECRET,
      {
        expiresIn: "1m",
        issuer: "ssubal"
      }
    );

    const refreshToken = jwt.sign(
      tokenPayload,
      process.env.REFRESH_SECRET,
      {
        expiresIn: "24h",
        issuer: "ssubal"
      }
    );

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);



    return res.status(200).json({
      id: userInfo.id,
      name: userInfo.name,
      provider: "kakao",
      groups: groupRows
    });

  } catch(error) {
    console.error(error);

    return res.status(500).json({
      code: "SERVER_ERROR",
      message: "서버 에러"
    });
  }
};


const signup = async (req, res) => {
  try {
    const { name } = req.body;

    const tempCookie = req.cookies.temp_info;

    if (!tempCookie) {
      return res.status(400).json({
        code: "EXPIRED_SESSION",
        message: "세션 만료"
      });
    }

    const tempInfo = JSON.parse(tempCookie);

    const [result] = await pool.query(
      `
      insert into users(provider, provider_id, name, img_url)
      values(?,?,?,?)
      `,
      [
        tempInfo.provider,
        tempInfo.userId,
        name,
        null
      ]
    );

    const newUserId = result.insertId;

    res.clearCookie("temp_info", cookieOptions);

    const tokenPayload = {
      id: newUserId,
      provider: tempInfo.provider,
      name,
      groupIds: []
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.ACCESS_SECRET,
      {
        expiresIn: "1m",
        issuer: "ssubal"
      }
    );

    const refreshToken = jwt.sign(
      tokenPayload,
      process.env.REFRESH_SECRET,
      {
        expiresIn: "24h",
        issuer: "ssubal"
      }
    );

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.status(201).json({
      code: "SIGNUP_SUCCESS",
      message: "가입 성공",
      data: {
        id: newUserId,
        name,
        provider: tempInfo.provider
      }
    });

  } catch(error) {
    return res.status(500).json({
      code: "SERVER_ERROR",
      message: "서버 에러"
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    const data = jwt.verify(
      token,
      process.env.REFRESH_SECRET
    );

    const [rows] = await pool.query(
      "select * from users where id = ? and provider = ?",
      [
        data.id,
        data.provider
      ]
    );

    const userInfo = rows[0];

    if (!userInfo) {
      return res.status(401).json({
        code: "USER_NOT_FOUND",
        message: "유저 없음"
      });
    }

    const [groupRows] = await pool.query(
      `
      select
        g.id as group_id,
        g.name as group_name,
        g.theme_color
      from group_participants p
      join group_lists g
      on p.group_id = g.id
      where p.user_id = ?
      `,
      [userInfo.id]
    );

    const groupIds = groupRows.map(
      group => group.group_id
    );

    const tokenPayload = {
      id: userInfo.id,
      provider: userInfo.provider,
      name: userInfo.name,
      groupIds
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.ACCESS_SECRET,
      {
        expiresIn: "1m",
        issuer: "ssubal"
      }
    );

    res.cookie(
      "accessToken",
      accessToken,
      cookieOptions
    );

    return res.status(200).json({
      ok: true
    });

  } catch(error) {
    return res.status(401).json({
      code: "INVALID_TOKEN",
      message: "유효하지 않은 토큰"
    });
  }
};


const loginSuccess = async (req, res) => {
  try {
    const userInfo = req.user;
    const { groupId } = req.query;

    if (!userInfo) {
      return res.status(401).json({
        code: "USER_NOT_FOUND",
        message: "유저를 찾을 수 없음"
      });
    }

    const [userRows] = await pool.query(
      "select * from users where id = ?",
      [userInfo.id]
    );

    if (userRows.length === 0) {
      return res.status(401).json({
        code: "USER_NOT_FOUND",
        message: "DB에 존재하지 않는 유저입니다."
      });
    }

    const dbUser = userRows[0];

    const [groupRows] = await pool.query(
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
      where p.user_id = ?
      `,
      [dbUser.id]
    );

    if (groupId) {
      const isMember = groupRows.some(
        group => group.group_id === parseInt(groupId)
      );

      if (!isMember) {
        return res.status(403).json({
          code: "NOT_GROUP_MEMBER",
          message: "그룹 멤버 아님",
          groups: groupRows
        });
      }
    }

    return res.status(200).json({
      id: dbUser.id,
      name: dbUser.name,
      provider: dbUser.provider,
      groups: groupRows
    });

  } catch(error) {
    return res.status(500).json({
      code: "SERVER_ERROR",
      message: "서버 에러"
    });
  }
};


const logout = async (req, res) => {
  try {
    res.clearCookie(
      "accessToken",
      cookieOptions
    );

    res.clearCookie(
      "refreshToken",
      cookieOptions
    );

    return res.status(200).json({
      code: "LOGOUT_SUCCESS",
      message: "로그아웃 성공"
    });

  } catch(error) {
    return res.status(500).json({
      code: "SERVER_ERROR",
      message: "서버 에러"
    });
  }
};


const updatePushToken = async (req, res) => {
  const { id } = req.user;
  const { pushToken } = req.body;

  const connection = await pool.getConnection();

  if (!id || !pushToken) {
    return res.status(400).json({
      code: "INVALID_PARAMETERS",
      success: false,
      message: "유저 ID와 푸시 토큰이 모두 필요"
    });
  }

  try {
    await connection.beginTransaction();

    await connection.query(
      "update users set push_token = null where push_token = ? and id != ?",
      [
        pushToken,
        id
      ]
    );

    await connection.query(
      "update users set push_token = ? where id = ?",
      [
        pushToken,
        id
      ]
    );

    await connection.commit();

    return res.status(200).json({
      code: "PUSH_TOKEN_UPDATED_SUCCESS",
      success: true,
      message: "푸시 토큰 업데이트 완료"
    });

  } catch(error) {

    await connection.rollback();

    return res.status(500).json({
      code: "SERVER_ERROR",
      message: "서버 에러"
    });

  } finally {
    connection.release();
  }
};


module.exports = {
  refreshToken,
  loginSuccess,
  kakaoLogin,
  signup,
  logout,
  updatePushToken
};