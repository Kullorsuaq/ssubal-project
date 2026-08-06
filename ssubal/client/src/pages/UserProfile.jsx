import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Profile from '../components/Profile';
import Board from '../components/Board';
import { getProfile } from '../api/user';
import { getPosts } from '../api/post';
import { getOrCreateChatRoom } from '../api/chat';
import useAuth from '../hooks/useAuth';
import usePopup from '../hooks/usePopup';
import styles from './UserProfile.module.css';

const UserProfile = () => {
  const { selectedGroup } = useAuth();
  const { groupId, userId } = useParams(); 
  const { openPopup } = usePopup();
  const [profile, setProfile] = useState({});
  const [userPosts, setUserPosts] = useState([]);
  const [boardLoading, setBoardLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile(groupId, userId);
        if(res.data.code === "GET_PROFILE_SUCCESS") {
          setProfile(res.data.profile);
        }
      } catch (error) {
        if(error.response && error.response.data.code === "SERVER_ERROR") {
          openPopup({ title: "서버 에러", content: "잠시 후 다시 시도해 주세요." });
        }
      }
    }
    fetchProfile();

    const fetchUserPosts = async () => {
      try {
        const res = await getPosts({ groupId, userId });
        if(res.data.code === "GET_POSTS_SUCCESS") {
          setUserPosts(res.data.data);
        }
      } catch (error) {
        if(error.response && error.response.data.code === "SERVER_ERROR") {
          openPopup({ title: "서버 에러", content: "잠시 후 다시 시도해 주세요." });
        }
      } finally {
        setBoardLoading(false);
      }
    }
    fetchUserPosts();
  }, [groupId, userId]);

  const handleChatClick = async (targetId) => {
    try {
      const res = await getOrCreateChatRoom(groupId, targetId);

      if(res.data.code === "FIND_CHATROOM_SUCCESS" || res.data.code === "CREATE_CHATROOM_SUCCESS") {
        const roomId = res.data.roomId;
        navigate(`/groups/${groupId}/chats/${roomId}`);        
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
        openPopup({title: "서버 에러", content: "잠시 후 다시 시도해 주세요."});
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ←
        </button>
        <h1 className={styles.title}>프로필</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.profileCard}>
          <div className={styles.profileTop}>
            <Profile profileImage={profile.img_url} />
            <div className={styles.profileInfo}>
              <h2 className={styles.userName}>{profile.user_name || '사용자'}</h2>
              <p className={styles.description}>{profile.description || '등록된 소개가 없습니다.'}</p>
            </div>
          </div>
          <button 
            type="button" 
            className={styles.chatBtn} 
            onClick={() => handleChatClick(userId)}
          >
            💬 1:1 채팅하기
          </button>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>쓴 글 목록</h3>
          <div className={styles.boardWrapper}>
            <Board results={userPosts} page={`/groups/${groupId}/posts/`} loading={boardLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile;