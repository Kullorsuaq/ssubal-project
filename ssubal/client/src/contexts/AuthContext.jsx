import { createContext, useState, useEffect } from 'react';
import { loginSuccess } from "../api/auth";
import usePopup from '../hooks/usePopup';

export const AuthContext = createContext();

//맨 처음에 사이트 렌더링될 때 실행됨
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); //{id: 1, name: '조은성', provider: 'kakao'} 이런 형식
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]); //{group_id : newGroupId, group_name: groupName, theme_color: color, description: description, created_at: created_at, role: role} 이런 형식
  const [selectedGroup, setSelectedGroup] = useState(null);
  const { openPopup } = usePopup();

  useEffect(() => {
    const themeColor =  selectedGroup ? selectedGroup.theme_color :'#FFB3C6';

    document.documentElement.style.setProperty('--theme-color', themeColor);
  }, [selectedGroup]);

  useEffect(() => {
    if(window.location.pathname === '/auth/signup') {
      setLoading(false);
      return;
    }

    const checkLoginStatus = async () => {
      try {
        const pathParts = window.location.pathname.split('/');
        let urlGroupId = null;

        if(pathParts[1] === "groups" && pathParts[2] && !isNaN(pathParts[2])) { //create가 아닌 숫자일 때만 parseInt를 함
          urlGroupId = parseInt(pathParts[2]);
        }
        
        const res = await loginSuccess(urlGroupId);
        
        const resData = res?.data || {};
        const resGroups = Array.isArray(resData.groups) ? resData.groups : [];
        const { groups: _, ...userData } = resData;  
        
        setUser(userData);
        setIsLogin(true);
        setGroups(resGroups);

        const foundGroup = (urlGroupId && resGroups.length > 0) 
          ? resGroups.find(group => group?.group_id === urlGroupId) 
          : null;
        
        const currentGroup = foundGroup || (resGroups.length > 0 ? resGroups[0] : null);

        setSelectedGroup(currentGroup); 
      } catch(error) {
        console.error("로그인 정보 가져오기 실패", error); 

        setUser(null);
        setIsLogin(false);
        setGroups([]);
        setSelectedGroup(null);

        const errorData = error.response.data;
        if (errorData && errorData.code === "NOT_GROUP_MEMBER") {          
          const serverGroups = Array.isArray(errorData.groups) ? errorData.groups : [];
          const firstGroup = serverGroups.length > 0 ? serverGroups[0] : null;

          if(firstGroup && firstGroup.group_id) {
            window.location.href = `/groups/${firstGroup.group_id}`;
          } else {
            window.location.href = '/';
          }
          return;
        }

        const pathname = window.location.pathname;

        const isAuthPage =
          pathname.startsWith("/auth/callback") ||
          pathname.startsWith("/auth/signup");

        if (!isAuthPage && error?.response?.status === 401) {
          if(window.location.pathname !== "/") {
            window.location.href = "/";
          }
        }
        
      } finally {
        setLoading(false); 
      }
    }
    console.log("loginSuccess 호출");
    checkLoginStatus();
  }, []);

  return (
    <AuthContext.Provider value={{
      isLogin, setIsLogin, 
      user, setUser,
      groups, setGroups,
      selectedGroup, setSelectedGroup
      }}>
      {!loading ? children : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg-color)',
          color: '#191919',
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif'
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>로딩 중...</div>
        </div>
      )}
    </AuthContext.Provider>
  )
}