import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatContext } from '../../contexts/ChatContext';
import { getMessages, setLastReadChatId } from '../../api/chat';
import useAuth from '../../hooks/useAuth';
import usePopup from '../../hooks/usePopup';
import Profile from '../../components/Profile';
import styles from './ChatRoom.module.css';
import { formatDateTime } from '../../../utils';

const ChatRoom = () => {
  const { groupId, roomId } = useParams();
  const navigate = useNavigate();
  const { socket, setChats } = useContext(ChatContext);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const { user, selectedGroup } = useAuth();
  const { openPopup } = usePopup();

  const messagesEndRef = useRef(null);
  //소켓 리스너가 중복 등록되는 것을 막기 위한 ref
  const isListenerRegistered = useRef(false);
  //처음 방에 들어왔는지 체크하는 ref
  const isInitialMount = useRef(true);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (messages.length === 0) return;

    if (isInitialMount.current) {
      scrollToBottom('auto');
      isInitialMount.current = false; 
    } else {
      scrollToBottom('smooth');
    }
  }, [messages]);

  useEffect(() => {
    isInitialMount.current = true;

    if(!socket || !roomId) return;

    socket.emit('join_room', roomId);

    //이미 리스너가 등록되어 있다면 중복 등록 방지
    if (!isListenerRegistered.current) {
      socket.on('receive_message', (messageRow) => {
        setMessages(prev => [ ...prev, messageRow ]);
      });
      isListenerRegistered.current = true;
    }

    const fetchMessages = async () => {
      try {
        const res = await getMessages(groupId, roomId);
        if(res.data.code === "GET_CONVERSATIONS_SUCCESS") {
          setMessages(res.data.data);
          console.log(res.data.data);
        }
      } catch(error) {
        if (error.response && error.response.data.code === "NOT_GROUP_MEMBER") {
          openPopup({
            title: "권한 없음",
            content: "해당 그룹의 멤버가 아니므로 채팅을 할 수 없습니다."
          });
          if(selectedGroup) {
            navigate(`/groups/${selectedGroup.group_id}`);
          } else {
            navigate('/groups');
          }
        }

        if(error.response && error.response.data.code === "SERVER_ERROR") {
          openPopup({title: "서버 에러", content: "잠시 후 다시 시도해 주세요." });
        }
      }
    };

    fetchMessages();

    return () => {
      socket.emit('leave_room', roomId);
      //방을 나갈 때 플래그를 초기화하여 다른 방으로 갈 때 정상 등록되도록 함
      isListenerRegistered.current = false;
    };
  }, [groupId, roomId, socket]);

  //마지막 채팅 읽음 처리
  useEffect(() => {
    if(messages.length === 0) return;

    const lastChat = messages[messages.length - 1];

    const setChatState = async () => {
      await setLastReadChatId(groupId, roomId, lastChat.id);

      setChats(prev => prev.map(chatRoom => {
        if(String(chatRoom.room_id) === String(roomId)) {
          return {
            ...chatRoom,
            last_read_chat_id: lastChat.id,
            last_message_content: lastChat.content,
            last_message_id: lastChat.id,
            last_message_time: lastChat.created_at
          };
        }
        return chatRoom;
      }));
    };
    setChatState();
  }, [messages, groupId, roomId, setChats]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;
    socket.emit('send_message', roomId, groupId, inputMessage);
    setInputMessage('');
  };

  const otherUserMessage = messages.find(message => user && message.user_id !== user.id);
  const chatTitle = otherUserMessage ? otherUserMessage.user_name : "채팅방";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ←
        </button>
        <h1 className={styles.headerTitle}>{chatTitle}</h1>
      </div>

      <ul className={styles.messageList}>
        {messages.map(message => {
          const isMe = user && message.user_id === user.id;
          return (
            <li
              key={message.id}
              className={`${styles.messageItem} ${isMe ? styles.myMessage : styles.otherMessage}`}
            >
              {!isMe && (
                <Profile userId={message.user_id} profileImage={message.img_url} />
              )}
              <div className={styles.messageContentWrapper}>
                <p className={styles.bubble}>{message.content}</p>
                <span className={styles.time}>{formatDateTime(message.created_at)}</span>
              </div>
            </li>
          );
        })}
        <div ref={messagesEndRef} />
      </ul>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input 
          type="text" 
          className={styles.input}
          value={inputMessage} 
          onChange={(e) => setInputMessage(e.target.value)} 
          placeholder="메시지를 입력하세요..."
        />
        <button type="submit" className={styles.sendBtn}>전송</button>
      </form>
    </div>
  );
};

export default ChatRoom;