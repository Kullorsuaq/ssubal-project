import axios from 'axios';
import { createContext, useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import useAuth from '../hooks/useAuth';
import usePopup from '../hooks/usePopup';
import { getNotifications, patchNotificationRead } from '../api/notification';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notiSocket, setNotiSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const { user, isLogin, selectedGroup } = useAuth();
  const groupId = selectedGroup ? selectedGroup.group_id : '';
  const navigate = useNavigate();
  const { openPopup } = usePopup();

  const fetchNotis = useCallback(async () => {
    try {
      const res = await getNotifications(groupId);
      if(res.data.code === "GET_NOTIFICATIONS_SUCCESS") {
        const notiList = res.data.notifications || [];
        setNotifications(notiList);

        const unreadExist = notiList.some(noti => noti.is_read === 0);
        setHasUnread(unreadExist);
      }
    } catch(error) {
      console.error('알림 목록 로딩 실패', error);
    }
  }, [groupId]);
  
  useEffect(() => {
    let newSocket;

    if(isLogin && user && groupId) {
      newSocket = io(`${import.meta.env.VITE_SERVER_DOMAIN}/notification`, {
        transports: ['websocket'],
        auth: { groupId }
      });

      newSocket.on('connect', () => {
        console.log("연결 성공, ID: ", newSocket.id);
        setNotiSocket(newSocket);
      })

      newSocket.on('receive_notification', () => {
        fetchNotis();
      });

      newSocket.on('connect_error', async (error) => {
        if(error.data) {
          const { status, code } = error.data;
          
          if(status === 401 && code === "TOKEN_EXPIRED") {
            try {
            const refreshRes = await axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/auth/refreshtoken`, {}, {withCredentials: true});
              newSocket.connect(); //return authApi(originalRequest); 역할
              return;
            } catch(refreshError) {  //리프레쉬 토큰도 없는(아예 로그인이 된 적 없는, 또는 로그인 만료된) 상황
              window.location.href = '/';
              return; 
            }
          }

          if(status === 403 && code === "NOT_GROUP_MEMBER") {
            newSocket.disconnect();

            openPopup({ title: "권한 없음", content: "해당 그룹의 멤버가 아니므로 채팅을 할 수 없습니다." });
            if(selectedGroup) {
              navigate(`/groups/${selectedGroup.group_id}`);
            } else {
              navigate('/groups');
            }
            return;  
          }
        }
        newSocket.disconnect(); 
      })
    }

    return () => { 
      if(newSocket) {
        newSocket.off('connect_error'); //언마운트시 클린업(이벤트 중복 등록을 막기 위함)
        newSocket.off('noti_error');
        newSocket.off('connect'); 
        newSocket.off('receive_notification');
        newSocket.disconnect(); 
        setNotiSocket(null);
      };
    }
  }, [isLogin, user, selectedGroup, groupId]);

  useEffect(() => {
    if(isLogin && user && groupId) {
      fetchNotis();
    }
  }, [isLogin, user, groupId, fetchNotis]);

  const readNotification = async (notiId) => {
    //낙관적 업데이트(즉시 빨간 점 끄기 및 로컬 state 최신화)
    setNotifications((prev) => {
      const updatedList = prev.map((noti) =>
        noti.id === notiId ? { ...noti, is_read: 1 } : noti
      );

      //남은 안 읽은 알림 유무 재계산
      const unreadExist = updatedList.some((noti) => noti.is_read === 0);
      setHasUnread(unreadExist);

      return updatedList;
    });

    try {
      await patchNotificationRead(groupId, notiId);
    } catch (error) {
      console.error('알림 읽음 처리 에러', error);
    }
  }

  return (
    <NotificationContext.Provider value={{ notiSocket, notifications, setNotifications, hasUnread, setHasUnread, readNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}