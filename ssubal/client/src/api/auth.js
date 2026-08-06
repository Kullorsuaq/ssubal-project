import { authApi, publicApi } from './instance';

export const kakaoLogin = (code) => {
  return authApi.post('/auth/kakaologin', { code });
}

export const loginSuccess = (groupId) => {
  //groupId가 있으면 쿼리 스트링으로 붙여서 보냄(ex /auth/login-success?groupId=3)
  return authApi.get('/auth/login/success', { params: { groupId } });
}

export const signup = (formData) => {
  return publicApi.post('/auth/signup', formData);
}

export const logout = () => {
  return authApi.get('/auth/logout'); 
}

export const updatePushToken = (pushToken) => {
  return authApi.patch('/auth/pushtoken', pushToken);
}