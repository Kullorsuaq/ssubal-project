const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  if(!token) return res.status(401).json({code: "NO_TOKEN", message: "쿠키에 토큰 없음"});

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
    req.user = decoded; //다음 미들웨어나 컨트롤러에서 쓰라고 넘겨줌
    console.log("next 직전");
    next();
  } catch(err) {
    if(err.name === 'TokenExpiredError') {
      return res.status(401).json({code: "TOKEN_EXPIRED", message: "토큰 만료"});
    }
    res.status(401).json({code: "INVALID_TOKEN", message: "유효하지 않은 토큰"});
  }
}

module.exports = {
  verifyToken
}