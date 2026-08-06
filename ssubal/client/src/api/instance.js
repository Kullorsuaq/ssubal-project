import axios from 'axios';

export const authApi = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_DOMAIN}/api`,
  withCredentials: true
});

authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if(error.response) {
      const { status, data } = error.response;
      console.error(data);

      if(status === 400) {
        //INVALID_PARAMETERS
        return Promise.reject(error);
      }

      if(status === 401) {
        if(data.code === "TOKEN_EXPIRED" && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            //리프레쉬 토큰이 있으면(로그인 만료된 상황이라면) 액세스 토큰 갱신하기 위해 요청 보냄 
            const refreshRes = await axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/api/auth/refreshtoken`, {}, {withCredentials: true});

            return authApi(originalRequest);
          } catch(refreshError) { //리프레쉬 토큰도 없는(아예 로그인이 된 적 없는, 또는 로그인 만료된) 상황이라면 에러 반환하여 로그인 화면을 띄움
            console.error(data);
            return Promise.reject(refreshError); //리프레쉬 토큰 만료 -> AuthContext의 loginSuccess 에러로 보내짐 -> user state 설정X -> Home에서 로그인 화면 띄워짐
          }
        }
        return Promise.reject(error);
      }

      if(status === 403) {
        //NEED_SIGNUP, NOT_GROUP_MEMBER
        return Promise.reject(error);
      }
    }  

    return Promise.reject(error);
  }
);

export const publicApi = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_DOMAIN}/api`,
  withCredentials: true
})

publicApi.interceptors.response.use(
  (response) => response, 
  async (error) => {
    const originalRequest = error.config;

    if(error.response) {
      const { status, data } = error.response;
      console.error(data);

      if(status === 400) {
        //EXPIRED_SESSION
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
)