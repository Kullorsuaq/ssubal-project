const jwt = require("jsonwebtoken");
const cookie = require("cookie");

const verifyToken = (socket, next) => {
  const { groupId } = socket.handshake.auth;
  const cookieHeader = socket.handshake.headers.cookie;

  if(!cookieHeader) {
    const err = new Error("쿠키 없음");
    err.data = { status: 401, code: "NO_TOKEN" };
    return next(err);
  }

  const cookies = cookie.parseCookie(cookieHeader);
  const token = cookies.accessToken;

  //소켓식 에러 처리하기
  //if(!token) return res.status(401).json({code: "NO_TOKEN", message: "쿠키에 토큰 없음"});
  if(!token) {
    const err = new Error("쿠키에 토큰 없음");
    err.data = { status: 401, code: "NO_TOKEN" };
    return next(err);
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
    //id를 위조해서 보낼 수도 있으니 토큰 통해 검증된 id 사용
    socket.userId = decoded.id;
    socket.groupId = groupId; 
    next();
  } catch(err) {
    const error = new Error("인증 실패");

    if(err.name === 'TokenExpiredError') {
      error.message = "토큰 만료";
      error.data = {  status: 401, code: "TOKEN_EXPIRED" };
    } else {
      error.message = "유효하지 않은 토큰";
      error.data = { status: 401, code: "INVALID_TOKEN" };
    }
    next(error);
  }
}

module.exports = {
  verifyToken
}