import { authApi, publicApi } from './instance';

export const getNotifications = (groupId) => {
  return authApi.get(`/groups/${groupId}/notifications`);
}

export const patchNotificationRead = (groupId, notificationId) => {
  return authApi.patch(`/groups/${groupId}/notifications/${notificationId}/read`);
}