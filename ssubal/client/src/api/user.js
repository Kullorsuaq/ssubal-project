import { authApi, publicApi } from './instance';

export const getProfile = (groupId, userId) => {
  return authApi.get(`/groups/${groupId}/users/${userId}/profile`);
}

export const editProfile = (groupId, userId, profileData) => {
  return authApi.patch(`/groups/${groupId}/users/${userId}/profile`, profileData);
} 