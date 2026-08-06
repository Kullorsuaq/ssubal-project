const express = require("express");
const postRouter = express.Router({ mergeParams: true }); //이 옵션이 있어야 부모 라우터(group)에 있는 :groupId 값을 자식 라우터에서도 읽을 수 있음
//postController에서 req.params를 통해 groupId 쓸 수 있음
//쿼리 스트링은 req.query를 통해
const { checkGroupMember } = require("../guards/groupGuard");
const { checkScheduleOwner } = require("../guards/scheduleGuard");

const { getPosts, getPostDetail, createPost, editPost, deletePost, createComment, deleteComment } = require("../controller/postController");

postRouter.use(checkGroupMember); //아래 모든 라우트에 공통으로 검증

//groups/:groupId/posts
postRouter.get('/', getPosts);
postRouter.get('/:postId', getPostDetail);
postRouter.post('/', checkScheduleOwner, createPost);
postRouter.patch('/:postId/', checkScheduleOwner, editPost);
postRouter.delete('/:postId', deletePost);
postRouter.post('/:postId/comments', createComment);
postRouter.delete('/:postId/comments/:commentId', deleteComment);

module.exports = postRouter;