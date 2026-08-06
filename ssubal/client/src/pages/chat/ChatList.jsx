import { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Profile from '../../components/Profile';
import { ChatContext } from '../../contexts/ChatContext';
import styles from './ChatList.module.css';
import { formatDateTime } from '../../../utils';

const ChatList = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { chats } = useContext(ChatContext);

  const validChats = chats ? chats.filter(chat => chat.last_message_content !== null) : [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ←
        </button>
        <h1 className={styles.title}>채팅</h1>
      </div>
      
      {validChats.length > 0 ? (
        <div className={styles.chatList}>
          {validChats.map(chat => {
            const hasUnread = chat.last_read_chat_id !== chat.last_message_id;

            return (
              <div 
                key={chat.room_id} 
                className={styles.chatItem}
                onClick={() => navigate(`/groups/${groupId}/chats/${chat.room_id}`)}
              >
                <div className={styles.chatInfoWrapper}>
                  <Profile 
                    profileImage={chat.target_user_img_url} 
                  />
                  <div className={styles.textContent}>
                    <div className={styles.nameRow}>
                      <span className={styles.name}>{chat.target_user_name}</span>
                      {hasUnread && <span className={styles.unreadDot} />}
                    </div>
                    <p className={styles.lastMessage}>{chat.last_message_content}</p>
                  </div>
                </div>
                <div className={styles.timeWrapper}>
                  <span className={styles.time}>{formatDateTime(chat.last_message_time)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyBox}>
          <p>진행 중인 채팅이 없습니다.</p>
        </div>
      )}

      <button
        className={styles.memberBadge}
        onClick={() => navigate(`/groups/${groupId}/members`)}
      >
        💬 새 채팅
      </button>
    </div>
  );
};

export default ChatList;