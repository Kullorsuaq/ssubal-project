const express = require("express");
const authRouter = express.Router();

const { login, refreshToken, loginSuccess, logout, kakaoLogin, signup, updatePushToken } = require("../controller/authController");
const { verifyToken } = require("../middleware/authMiddleware"); 

//auth/
authRouter.post('/refreshtoken', refreshToken);
authRouter.get('/login/success', verifyToken, loginSuccess);
authRouter.post('/kakaologin', kakaoLogin);
authRouter.post('/signup', signup);
authRouter.get('/logout', logout);
authRouter.patch('/pushtoken', verifyToken, updatePushToken);

module.exports = authRouter;