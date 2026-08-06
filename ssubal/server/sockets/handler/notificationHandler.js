const pool = require("../../config/database");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkGroupMember } = require("../guards/groupGuard");

function notificationHandler(notiIo) {
  notiIo.use(verifyToken);
  notiIo.use(checkGroupMember);

  notiIo.on('connection', socket => {
    const id = socket.userId;

    socket.join(`user_${id}`);

    const groupId = socket.groupId;
    socket.join(`group_${groupId}`);
    
    socket.on('send_notification', async (receiverId='all') => {
      if(receiverId !== 'all') { //한 명에게 보내는 알림일 때
        notiIo.to(`user_${receiverId}`).emit('receive_notification');
      } else { //그룹 전체에 보내는 알림일 때(자신 제외)
        socket.to(`group_${groupId}`).emit('receive_notification');
      }
    });
  });
}

module.exports = notificationHandler;