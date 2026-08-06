import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Profile from '../../components/Profile';
import Board from '../../components/Board';
import useAuth from '../../hooks/useAuth';
import usePopup from '../../hooks/usePopup';
import { logout } from '../../api/auth';
import { getProfile, editProfile } from '../../api/user';
import { getPosts } from '../../api/post';
import styles from './MyPage.module.css';

const MyPage = () => {
  const { groupId } = useParams(); 
  const [profile, setProfile] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    image: '',
    img_url: '',
    description: ''
  });
  const [boardLoading, setBoardLoading] = useState(true);
  const fileInput = useRef(null);
  const navigate = useNavigate();
  const { user, setUser, setIsLogin, setGroups, setSelectedGroup } = useAuth();
  const { openPopup } = usePopup();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile(groupId, user.id);
        if(res.data.code === "GET_PROFILE_SUCCESS") {
          setProfile(res.data.profile);
        }
      } catch(error) {
        if(error.response && error.response.data.code === "SERVER_ERROR") {
          openPopup({ title: "서버 에러", content: "잠시 후 다시 시도해 주세요." });
        }
      }
    };
    fetchProfile();

    const fetchMyPosts = async () => {
      try {
        const res = await getPosts({ groupId, userId: user.id });
        if(res.data.code === "GET_POSTS_SUCCESS") {
          setMyPosts(res.data.data);
        }
      } catch(error) {
        if(error.response && error.response.data.code === "SERVER_ERROR") {
          openPopup({ title: "서버 에러", content: "잠시 후 다시 시도해 주세요." });
        }
      } finally {
        setBoardLoading(false);
      }
    };
    fetchMyPosts();
  }, [groupId, user]);

  const changeEditMode = () => {
    setFormData(prev => ({ ...prev, description: profile.description || '' }));
    setIsEditMode(true);
  };

  const handleImageClick = () => {
    if(fileInput.current) {
      fileInput.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if(file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, image: file, img_url: imageUrl }));
    }
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      data.append('description', formData.description);

      if(formData.image) {
        data.append('profileImage', formData.image);
      }

      const res = await editProfile(groupId, user.id, data);
      
      if(res.data.code === "EDIT_PROFILE_SUCCESS") {
        setProfile(res.data.profile);
        setFormData(prev => ({ ...prev, image: null, img_url: '' }));
        setIsEditMode(false);
      }         
    } catch(error) {
      if(error.response && error.response.data.code === "SERVER_ERROR") {
        openPopup({ title: "서버 에러", content: "잠시 후 다시 시도해 주세요." });
      }
    }
  };

  const handleLogout = async () => {
    const res = await logout();
    if(res.data.code === "LOGOUT_SUCCESS") {
      if(window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOGOUT' }))
      }

      setUser(null);
      setIsLogin(false);
      setGroups([]);
      setSelectedGroup(null);
      navigate('/');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button 
          type="button" 
          className={styles.backButton} 
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <h1 className={styles.title}>마이페이지</h1>
      </header>

      <input type="file" accept="image/*" ref={fileInput} onChange={handleFileChange} style={{ display: 'none' }} />

      <div className={styles.content}>
        <div className={styles.profileSection}>
          {isEditMode ? (
            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div onClick={handleImageClick} style={{ cursor: 'pointer' }}>
                <Profile userId={profile.user_id} profileImage={formData.img_url || profile.img_url} />
              </div>
              <input 
                type="text" 
                className={styles.input}
                value={formData.description} 
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} 
                placeholder="상태 메시지를 입력하세요..."
              />
              <div className={styles.buttonGroup}>
                <button type="button" className={styles.btnSecondary} onClick={() => setIsEditMode(false)}>취소</button>
                <button type="submit" className={styles.btnPrimary}>완료</button>
              </div>
            </form>
          ) : (
            <>
              <Profile name={profile.user_name} profileImage={profile.img_url} />
              <p className={styles.description}>{profile.description || '등록된 상태 메시지가 없습니다.'}</p>
              <button type="button" className={styles.btnSecondary} onClick={changeEditMode}>수정</button>
            </>
          )}
        </div>

        <ul className={styles.sectionList}>
          <li>
            <div>
              <h2 className={styles.sectionTitle}>내가 쓴 글 목록</h2>
              <Board results={myPosts} page={`/groups/${groupId}/posts/`} loading={boardLoading} />
            </div>
          </li>
          <li style={{ textAlign: 'center', marginTop: '10px', marginBottom: '20px' }}>
            <button type="button" className={styles.btnDanger} onClick={handleLogout}>
              로그아웃
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MyPage;