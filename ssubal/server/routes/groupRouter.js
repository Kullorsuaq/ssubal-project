const express = require("express");
const postRouter = require("./postRouter");
const scheduleRouter = require('./scheduleRouter');
const chatRouter = require('./chatRouter');
const userRouter = require("./userRouter");
const notiRouter = require("./notiRouter");

const groupRouter = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { checkGroupAccess, checkGroupMember } = require("../guards/groupGuard");

const { getGroups, verifyGroupPassword, groupSignup, createGroup, getGroupParticipants } = require("../controller/groupController");

groupRouter.use(verifyToken); //아래 모든 라우트에 공통으로 검증

//groups/
groupRouter.get('/', getGroups);
groupRouter.post('/:groupId/verify', checkGroupAccess, verifyGroupPassword);
groupRouter.post('/:groupId/signup', checkGroupAccess, groupSignup);
groupRouter.post('/', createGroup);
groupRouter.get('/:groupId/participants', checkGroupMember, getGroupParticipants);

groupRouter.use('/:groupId/posts', postRouter);
groupRouter.use('/:groupId/schedules', scheduleRouter);
groupRouter.use('/:groupId/chats', chatRouter);
groupRouter.use('/:groupId/users', userRouter);
groupRouter.use('/:groupId/notifications', notiRouter);

module.exports = groupRouter;