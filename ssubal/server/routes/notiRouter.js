const express = require("express");
const notiRouter = express.Router({ mergeParams: true });

const { checkGroupMember } = require("../guards/groupGuard");

const { getNotifications, patchNotificationRead  } = require("../controller/notiController");

notiRouter.use(checkGroupMember);

//groups/:groupId/notifications
notiRouter.get('/', getNotifications);
notiRouter.patch('/:notificationId/read', patchNotificationRead);

module.exports = notiRouter; 