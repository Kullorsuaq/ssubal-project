import { useContext } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ChatContext } from '../contexts/ChatContext';
import styles from './NavigationBar.module.css';

import home from '../assets/icons/home.svg';
import homeFilled from '../assets/icons/home-filled.svg';
import schedule from '../assets/icons/schedule.svg';
import scheduleFilled from '../assets/icons/schedule-filled.svg';
import post from '../assets/icons/post.svg';
import postFilled from '../assets/icons/post-filled.svg';
import chat from '../assets/icons/chat.svg';
import chatFilled from '../assets/icons/chat-filled.svg';
import mypage from '../assets/icons/mypage.svg';
import mypageFilled from '../assets/icons/mypage-filled.svg';

function NavigationBar() {
  const { groupId } = useParams();
  const location = useLocation();
  const { hasUnreadChat } = useContext(ChatContext);

  const groupBasePath = groupId ? `/groups/${groupId}` : '/groups';

  const navItems = [
    {
      id: 'home',
      label: '홈',
      path: '/',
      iconLine: home,
      iconFilled: homeFilled
    },
    {
      id: 'schedules', 
      label: '스케줄', 
      path: `${groupBasePath}/schedules`, 
      iconLine: schedule, 
      iconFilled: scheduleFilled
    },
    {
      id: 'posts', 
      label: '대타 신청', 
      path: `${groupBasePath}/posts`, 
      iconLine: post, 
      iconFilled: postFilled
    },
    {
      id: 'chats', 
      label: '채팅', 
      path: `${groupBasePath}/chats`, 
      iconLine: chat, 
      iconFilled: chatFilled,
      hasBadge: hasUnreadChat 
    },
    {
      id: 'mypage', 
      label: 'my', 
      path: `${groupBasePath}/mypage`, 
      iconLine: mypage, 
      iconFilled: mypageFilled
    },
  ];

  return (
    <nav className={styles.navigationBar}>
      <ul className={styles.navList}>
        {navItems.map(({ id, label, path, iconLine, iconFilled, hasBadge }) => {
          const isActive = location.pathname === path;

          return (
            <li key={id} className={styles.navItem}>
              <Link to={path} className={styles.navLink}>
                {/* 아이콘 감싸는 래퍼(빨간 점 위치 기준점) */}
                <div className={styles.iconWrapper}>
                  <img 
                    src={isActive ? iconFilled : iconLine} 
                    alt={label} 
                    width={24} 
                    height={24} 
                  />
                  {/* 빨간 점 표시 */}
                  {hasBadge && <span className={styles.badge} />}
                </div>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default NavigationBar;