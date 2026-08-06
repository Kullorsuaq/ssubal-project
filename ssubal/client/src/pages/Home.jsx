import { loginSuccess, updatePushToken } from '../api/auth';
import Login from './auth/Login';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo, useContext } from "react";
import { NotificationContext } from '../contexts/NotificationContext';
import { ChatContext } from '../contexts/ChatContext';
import useAuth from '../hooks/useAuth';
import useCalendar from '../hooks/useCalendar';
import useBoard from '../hooks/useBoard';
import GroupSelector from '../components/group/GroupSelector';
import GroupJoin from '../components/group/GroupJoin';
import WeeklyStatusBoard from '../components/WeeklyStatusBoard';
import Board from '../components/Board';
import Notification from '../components/Notification';
import { getPosts } from '../api/post';
import { getTodayString } from '../../utils';

import notificationIcon from '../assets/icons/notification.svg';
import styles from './Home.module.css';

const getDaysTogether = (createdAt) => {
  if (!createdAt) return 1;
  const start = new Date(createdAt);
  const today = new Date();
  
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
};

const Home = () => {
  const { user, isLogin, groups, selectedGroup } = useAuth();
  console.log({
  user,
  isLogin,
  selectedGroup
});
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const { notifications, hasUnread, readNotification } = useContext(NotificationContext);
  const { groupId } = useParams();
  const [weeklySchedules, setWeeklySchedules] = useState([]);
  const navigate = useNavigate();

  const boardParams = user && isLogin && (groupId || selectedGroup) && (useMemo(() => ({
    groupId: selectedGroup.group_id,
    limit: 5
  }), [selectedGroup]));

  const { getWeeklySchedules, monthlySchedules, scheduleLoading } = useCalendar(); 
  const { results, keyword, setKeyword, page, setPage, totalCount, boardLoading } = useBoard(getPosts, boardParams);

  useEffect(() => {
    if (isLogin && user && selectedGroup && window.location.pathname === '/') {
      navigate(`/groups/${selectedGroup.group_id}`, { replace: true });
    }
  }, [isLogin, user, selectedGroup, navigate]);

  useEffect(() => {
    if (!user || !selectedGroup) return;

    const handleMessageFromApp = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'RESPONSE_PUSH_TOKEN') {
          updatePushToken({ pushToken: data.token })
            .then((res) => console.log("기존 유저 토큰 업데이트 성공:", res.data.message))
            .catch((err) => console.error("토큰 업데이트 실패:", err));
        }
      } catch (error) {}
    };

    window.addEventListener('message', handleMessageFromApp);
    document.addEventListener('message', handleMessageFromApp);

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REQUEST_PUSH_TOKEN' }));
    }

    return () => {
      window.removeEventListener('message', handleMessageFromApp);
      document.removeEventListener('message', handleMessageFromApp);
    };
  }, [user, selectedGroup]);

  useEffect(() => {
    if(!groupId || Object.keys(monthlySchedules).length === 0 || !selectedGroup) {
      return;
    }

    const todayStr = getTodayString();
    const current = new Date(todayStr);
    const day = current.getDay();

    const distanceToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(current);
    monday.setDate(current.getDate() + distanceToMonday);

    const weekDates = [];
    for(let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      weekDates.push(nextDay.toLocaleDateString('sv-SE'));
    }

    const weeklyData = getWeeklySchedules(weekDates);
    setWeeklySchedules(weeklyData);

  }, [groupId, monthlySchedules, selectedGroup]);

  const handleNotiClick = (notiId, page) => {
    readNotification(notiId);

    const targetGroupId = groupId || (selectedGroup && selectedGroup.group_id);

    if (page && targetGroupId) {
      navigate(`/groups/${targetGroupId}/${page}`);
    }
  }

  if(!user) {
    return (
      <div className={styles.loginContainer}>
        <Login />
      </div>
    )
  }

  if(!selectedGroup) {
    return (
      <div className={styles.noGroupContainer}>
        <h1>{user.name}님, 어서오세요! ✨</h1>
        <GroupJoin />
      </div>
    )
  }

  return (
    <div className={styles.homeContainer}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
            <div className={styles.miniLogo}>🧩</div>
          <GroupSelector groups={groups} />
        </div>
        
        <div className={styles.headerRight}>
          <button 
            type="button" 
            onClick={() => setIsNotiOpen(true)}
            className={styles.notiButton}
          >
            <img src={notificationIcon} alt="알림" width={22} height={22} />
            {hasUnread && <span className={styles.redDot} />}
          </button>
        </div>
      </header>

      <Notification 
        isNotiOpen={isNotiOpen} 
        setIsNotiOpen={setIsNotiOpen} 
        notifications={notifications} 
        onNotiClick={handleNotiClick} 
      />

      <main className={styles.mainContent}>
        <section className={styles.welcomeSection}>
          <div className={styles.welcomeMeta}>
            <span className={styles.groupBadge}>
              {selectedGroup.group_name}
            </span>
            <span className={styles.daysText}>
              D+{getDaysTogether(selectedGroup.created_at)}
            </span>
          </div>
          <h1 className={styles.welcomeText}>
            <span className={styles.userName}>{user.name}</span>님, 어서오세요! ✨
          </h1>
          <p className={styles.groupDescription}>
            {selectedGroup.description || `환영합니다! 함께 즐거운 일상을 만들어가요.`}
          </p>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>이번 주 스케줄표</h2>
          </div>
          <WeeklyStatusBoard weeklySchedules={weeklySchedules} loading={boardLoading}/>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>대타 구해요</h2>
          </div>
          <Board results={results} page={'posts'} loading={boardLoading}/>
        </section>
      </main>
    </div>
  )
}

export default Home;