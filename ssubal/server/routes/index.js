const jwt = require('jsonwebtoken');

const router = require("express").Router();
const { loginSuccess, refreshToken, kakaoLogin, signup } = require("../controller/authController");
const { verifyToken } = require('../middleware/authMiddleware');

const authRouter = require("./authRouter");
const groupRouter = require("./groupRouter");
const userRouter = require("./userRouter");

router.use('/auth', authRouter);
router.use('/groups', groupRouter);

//테스트 로그인은 /api/testlogin으로!
router.get('/testlogin', async (req, res) => {
  console.log('실행!');
  const tokenPayload = { id: 2, provider: 'kakao', name: '김철수', groupIds: [] };

  const accessToken = jwt.sign(tokenPayload, process.env.ACCESS_SECRET, {expiresIn: '1h', issuer: 'ssubal'});
  const refreshToken = jwt.sign(tokenPayload, process.env.REFRESH_SECRET, {expiresIn: '24h', issuer: 'ssubal'});

  res.cookie('accessToken', accessToken, {secure: true, httpOnly: true, sameSite: 'none', path:'/' });
  res.cookie('refreshToken', refreshToken, {secure: true, httpOnly: true,  sameSite: 'none', path:'/' });

  res.redirect(`https://d2ni5rf8m1oigh.cloudfront.net`);
})

module.exports = router; 