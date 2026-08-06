import { authApi, publicApi } from './instance';

export const getPosts = ({no = 1, keyword = '', groupId, userId, limit = 10}) => {
  return authApi.get(`/groups/${groupId}/posts`, {
    params: {
      no,
      keyword: keyword || undefined, //빈 값이면 쿼리에서 자동 제외(undefined면 axios가 알아서 URL에서 빼줌)
      limit,
      userId
    }
  });
}

export const getPostDetail = (groupId, postId) => {
  return authApi.get(`/groups/${groupId}/posts/${postId}`);
}

export const createPost = (groupId, postData) => {
  return authApi.post(`/groups/${groupId}/posts`, postData);
}

export const editPost = (groupId, postId, postData) => {
  return authApi.patch(`/groups/${groupId}/posts/${postId}`, postData);
} 

export const deletePost = (groupId, postId) => {
  return authApi.delete(`/groups/${groupId}/posts/${postId}`);
}

export const createComment = (groupId, postId, commentData) => {
  return authApi.post(`/groups/${groupId}/posts/${postId}/comments`, commentData);
}

export const deleteComment = (groupId, postId, commentId) => {
  return authApi.delete(`/groups/${groupId}/posts/${postId}/comments/${commentId}`);
}