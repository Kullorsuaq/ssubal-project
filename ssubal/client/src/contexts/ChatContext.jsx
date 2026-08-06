import axios from 'axios';
import { createContext, useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import useAuth from '../hooks/useAuth';
import usePopup from '../hooks/usePopup';
import { getAllChats, setLastReadChatId } from '../api/chat';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const { user, isLogin, selectedGroup } = useAuth();
  const groupId = selectedGroup ? selectedGroup.group_id : '';
  const navigate = useNavigate();
  const { openPopup } = usePopup();

  useEffect(() => {
    let newSocket;

    if(isLogin && user && groupId) {
      newSocket = io(`${import.meta.env.VITE_SERVER_DOMAIN}/chat`, {
        transports: ['websocket'],
        auth: { groupId }
      });

      newSocket.on('connect', () => {
        console.log("연결 성공, ID: ", newSocket.id);
        setSocket(newSocket);
      })

      //받은 마지막 메시지 채팅 내용으로 추가하기
      newSocket.on('receive_message', (messageRow, roomId, chatId) => {
        console.log(roomId);
        console.log(chatId);
        console.log(messageRow);
        setChats(prev => prev.map(chatRoom => {
          if(String(chatRoom.room_id) === String(roomId)) {
            return {
              ...chatRoom,
              last_message_content: messageRow.content,
              last_message_id: chatId,
              last_message_time: messageRow.created_at
            }
          }
          return chatRoom;
        })); //messageRow는 마지막 채팅
      });

      //connect_error는 소켓 연결 실패한 경우만 다룸
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

      newSocket.on('chat_error', errData => {
        if(errData.code === "SERVER_ERROR") {
          openPopup({ title: "서버 에러", content: "잠시 후 다시 시도해 주세요." });
        }
      })
    }

    //채팅 서비스 나갈 때 연결 종료
    return () => {
      if(newSocket) {
        newSocket.off('receive_message');
        newSocket.off('connect_error'); //언마운트시 클린업(이벤트 중복 등록 방지)
        newSocket.off('chat_error');
        newSocket.off('connect');
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [isLogin, user, groupId]);

    //채팅 목록 불러오기(마지막 채팅 내용 가져옴)
    useEffect(() => {
    const fetchAllChats = async () => {
      try {
        const res = await getAllChats(groupId);

        if(res.data.code === "GET_ALL_CHATS_SUCCESS") {
          setChats(res.data.data);
        }
      } catch(error) {
          if (error.response && error.response.data.code === "NOT_GROUP_MEMBER") {
            openPopup({
              title: "권한 없음",
              content: "해당 그룹의 멤버가 아니므로 채팅할 수 없습니다."
            });
            if(selectedGroup) {
              navigate(`/groups/${selectedGroup.group_id}`);
            } else {
              navigate('/groups');
            }
          }

          if(error.response && error.response.data.code === "SERVER_ERROR") {
            openPopup({title: "서버 에러", content: "잠시 후 다시 시도해 주세요."});
          }
        }
      }

    fetchAllChats();
  }, [groupId]);

  useEffect(() => {
    setHasUnreadChat(chats.some(chat => String(chat.last_read_chat_id) !== String(chat.last_message_id)));
  }, [chats]);  

  return (
    <ChatContext.Provider value={{ socket, chats, setChats, hasUnreadChat }}>
      {children}
    </ChatContext.Provider>
  )
}