const express = require("express");
const chatRouter = express.Router({ mergeParams: true }); //이 옵션이 있어야 부모 라우터(group)에 있는 :groupId 값을 자식 라우터에서도 읽을 수 있음

const { checkGroupMember } = require("../guards/groupGuard");
const { checkChatParticipant } = require("../guards/chatGuard");

const { getOrCreateChatRoom, getMessages, getAllChats, setLastReadChatId } = require("../controller/chatController");

chatRouter.use(checkGroupMember); //아래 모든 라우트에 공통으로 검증

//group/:groupId/chats
chatRouter.post('/', getOrCreateChatRoom);
chatRouter.get('/:roomId', checkChatParticipant, getMessages);
chatRouter.get('/', getAllChats);
chatRouter.patch('/:roomId/read', checkChatParticipant, setLastReadChatId);

module.exports = chatRouter;