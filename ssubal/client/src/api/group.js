import { authApi, publicApi } from './instance';

export const getGroups = ({ no = 1, keyword = '' }) => {
  return authApi.get(`/groups/?no=${no}&keyword=${encodeURIComponent(keyword)}`);
}

export const verifyGroupPassword = (groupId, password) => {
  return authApi.post(`/groups/${groupId}/verify`, { groupId, password });
}

export const groupSignup = (groupId, password, startDate) => {
  return authApi.post(`/groups/${groupId}/signup`, { password, startDate });
}

export const createGroup = (userId, groupData, positionList) => {
  return authApi.post('/groups', {
    userId,
    ...groupData,
    positionList: positionList
  });
}

export const getGroupParticipants = (groupId)  => {
  return authApi.get(`/groups/${groupId}/participants`);
}