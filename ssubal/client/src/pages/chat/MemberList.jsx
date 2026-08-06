import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import usePopup from '../../hooks/usePopup';
import Profile from "../../components/Profile";
import { getGroupParticipants } from "../../api/group";
import { getOrCreateChatRoom } from '../../api/chat';
import styles from './MemberList.module.css';

const MemberList = () => {
  const { groupId } = useParams();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);

  const navigate = useNavigate();
  const { user, selectedGroup } = useAuth();
  const { openPopup } = usePopup();

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const res = await getGroupParticipants(groupId);

        if (res.data.code === "FETCH_PARTICIPANTS_SUCCESS") {
          setMembers(res.data.data);
        }

      } catch(error) {
        const code = error.response.data.code;

        if(code === "NOT_GROUP_MEMBER") {
          openPopup({
            title: "권한 없음",
            content: "해당 그룹의 멤버가 아니므로 채팅할 수 없습니다."
          });

          if(selectedGroup) {
            navigate(`/groups/${selectedGroup.group_id}`);
          } else {
            navigate('/groups');
          }
          return;
        }

        if(code === "SERVER_ERROR") {
          openPopup({
            title: "서버 에러",
            content: "잠시 후 다시 시도해 주세요."
          });
        }

      } finally {
        setLoading(false);
      }
    };

    if(groupId) {
      fetchParticipants();
    } else {
      setLoading(false);
    }

  }, [groupId, selectedGroup, navigate, openPopup]);


  const handleChatClick = async (targetId) => {
    try {
      const res = await getOrCreateChatRoom(groupId, targetId);

      if(
        res.data.code === "FIND_CHATROOM_SUCCESS" ||
        res.data.code === "CREATE_CHATROOM_SUCCESS"
      ) {
        const roomId = res.data.roomId;
        navigate(`/groups/${groupId}/chats/${roomId}`);
      }

    } catch(error) {
      const code = error.response.data.code;

      if(code === "NOT_GROUP_MEMBER") {
        openPopup({
          title: "권한 없음",
          content: "해당 그룹의 멤버가 아니므로 채팅을 할 수 없습니다."
        });

        if(selectedGroup) {
          navigate(`/groups/${selectedGroup.group_id}`);
        } else {
          navigate('/groups');
        }
        return;
      }

      if(code === "SERVER_ERROR") {
        openPopup({
          title: "서버 에러",
          content: "잠시 후 다시 시도해 주세요."
        });
      }
    }
  };

  const validMembers = members.filter(
    member => member.user_id !== user.id
  );


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backBtn} 
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <h1 className={styles.title}>
          새 채팅
        </h1>
      </div>

      {loading ? (
        <div className={styles.emptyBox}>
          <p>멤버 불러오는 중...</p>
        </div>
      ) : validMembers.length > 0 ? (

        <div className={styles.memberList}>
          {validMembers.map(member => (
            <div
              key={member.user_id}
              className={styles.memberItem}
              onClick={() => handleChatClick(member.user_id)}
            >

              <div className={styles.memberInfoWrapper}>
                <Profile
                  profileImage={member.img_url}
                />

                <div className={styles.textContent}>
                  <div className={styles.nameRow}>
                    <span className={styles.name}>
                      {member.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyBox}>
          <p>채팅할 수 있는 멤버가 없습니다.</p>
        </div>
      )}
    </div>
  );
};


export default MemberList;