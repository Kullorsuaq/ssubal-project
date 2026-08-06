const express = require("express");
const userRouter = express.Router({ mergeParams: true });

const { checkGroupMember } = require("../guards/groupGuard");

const upload = require("../middleware/uploadMiddleware");

const { getProfile, editProfile } = require("../controller/userController");

userRouter.use(checkGroupMember);

//groups/:groupId/users
userRouter.get('/:userId/profile', getProfile);
userRouter.patch('/:userId/profile', upload.single('profileImage'), editProfile);

module.exports = userRouter; 