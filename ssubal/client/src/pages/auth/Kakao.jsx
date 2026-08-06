import axios from "axios";
import { kakaoLogin } from "../../api/auth";
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from "../../hooks/useAuth";
import styles from './Kakao.module.css'; 

function Kakao() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLogin, setUser, setGroups, setSelectedGroup } = useAuth();

  const isFetched = useRef(false);

  useEffect(() => {
    if(isFetched.current) return; 

    const handleKakaoLogin = async () => {
      //카카오 페이지 진입
      try {
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get("code");        
        if(!code) return;

        isFetched.current = true;

        const result = await kakaoLogin(code);
        
        if(result.status === 200) {

          const resData = result?.data || {};
          const resGroups = Array.isArray(resData.groups) ? resData.groups : [];
          const { groups: _, ...userData } = resData;       
          
          setUser(userData);
          setIsLogin(true);
          setGroups(resGroups);

          const firstGroup = resGroups.length > 0 ? resGroups[0] : null;
          setSelectedGroup(firstGroup);
        
          if (firstGroup && firstGroup.group_id) {
            navigate(`/groups/${firstGroup.group_id}`, { replace: true });
          } else {
            navigate('/groups/create', { replace: true });
          }
        }
      } catch (error) {
        if(error.response && error.response.data) {
          const { code } = error.response.data;

          if(code === "NEED_SIGNUP") {
            navigate('/auth/signup', { replace: true });
            return;
          }
        }
        
        navigate('/', { replace: true });
      }
    };

    handleKakaoLogin();
  }, [location.search, navigate, setIsLogin, setUser, setGroups, setSelectedGroup]);

  return (
    <div className={styles.container}>
      <div className={styles.spinner}>🐾</div>
      <h2 className={styles.title}>카카오 로그인 중...</h2>
    </div>
  );
}

export default Kakao;