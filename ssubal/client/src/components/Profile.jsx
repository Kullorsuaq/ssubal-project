import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import styles from './Profile.module.css';

const Profile = ({ userId, name, profileImage, onClick, loading }) => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const defaultImage = '/default-profile.png';

  //채팅 목록처럼 마이페이지로 이동하지 않게 하려면 userId prop 안 주면 됨
  const shouldDisableLink = !userId || onClick;

  const getImageSrc = () => {
    if (!profileImage) return defaultImage;

    //리액트에서 임시로 만든 미리보기 이미지
    if (profileImage.startsWith('blob:')) return profileImage; // /uploads/...

    return `${import.meta.env.VITE_SERVER_DOMAIN}${profileImage}`;
  };

  if (shouldDisableLink) {
    return (
      <div className={styles.profileContainer} onClick={onClick}>
        <img className={styles.avatar} src={getImageSrc()} alt={`${name || '사용자'} 프로필`} />
        {name && <span className={styles.name}>{name}</span>}
      </div>
    );
  }

  const profileLink = userId === user?.id ? `/groups/${groupId}/mypage` : `/groups/${groupId}/members/${userId}`;

  return (
    <Link to={profileLink} className={styles.profileContainer}>
      <img className={styles.avatar} src={getImageSrc()} alt={`${name || '사용자'} 프로필`} />
      <span className={styles.name}>{name}</span>
    </Link>
  );
};

export default Profile;