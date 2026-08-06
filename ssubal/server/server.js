const express = require('express');
const dotenv = require('dotenv');
const path = require("path");
const cookieParser = require('cookie-parser');
const cors = require('cors');
const router = require("./routes");

const http = require("http");
const { Server } = require("socket.io");
const chatHandler = require('./sockets/handler/chatHandler');
const notificationHandler = require('./sockets/handler/notificationHandler');
const app = express(); 
app.set("trust proxy", 1);
const server = http.createServer(app); 
dotenv.config();

const pool = require("./config/database"); 

app.use(express.json()); 

//브라우저가 /uploads/파일명.jpg로 요청하면 서버 안의 uploads 폴더에서 파일을 찾아줌
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cookieParser());

//일반 http 요청을 위한 cors(Express용)
app.use(cors({
  origin: ['https://d2ni5rf8m1oigh.cloudfront.net', `${process.env.SERVER_DOMAIN}:5173`],
  methods: ["GET", "POST", "DELETE", "PATCH", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true
}))

app.use('/api', router);

//socket.io 코드
//실시간 통신을 위한 cors(Socket.io용)
const io = new Server(server, {
  cors: {
    origin: ['https://d2ni5rf8m1oigh.cloudfront.net', `${process.env.SERVER_DOMAIN}:5173`],
    methods: ["GET", "POST"],
    credentials: true
  }
}); //소켓 서버 객체

const chatIo = io.of("/chat"); //채팅 서비스 전용 라인 개통
chatHandler(chatIo); 

const notiIo = io.of("/notification"); //알림 서비스 전용 라인 개통
notificationHandler(notiIo);

//서버 코드
server.listen(process.env.PORT, () => {
  console.log(`server is on ${process.env.PORT}`);
})