import { authApi, publicApi } from './instance';

//방 없으면 만들고 있으면 기존 방 ID 가져옴
export const getOrCreateChatRoom = (groupId, targetId) => { //targetId는 채팅하려는 상대 유저 id
  return authApi.post(`/groups/${groupId}/chats`, { targetId });
}

export const getMessages = (groupId, roomId) => {
  return authApi.get(`/groups/${groupId}/chats/${roomId}`);
}

export const getAllChats = (groupId) => {
  return authApi.get(`/groups/${groupId}/chats`);
}

export const setLastReadChatId = (groupId, roomId, chatId) => {
  return authApi.patch(`/groups/${groupId}/chats/${roomId}/read`, { chatId });
}