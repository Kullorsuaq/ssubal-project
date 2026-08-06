import { useNavigate, useParams } from 'react-router-dom';
import CalendarView from '../../components/schedule/CalendarView';
import useCalendar from '../../hooks/useCalendar';
import styles from './Schedule.module.css';

const Schedule = () => {
  const navigate = useNavigate();
  const { monthlySchedules, currentDate, setCurrentDate } = useCalendar(true);
  const { groupId } = useParams();

  return (
    <div className={styles.postContainer}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>근무 스케줄표</h1>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.miniLogo}>🧩</span>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.boardSection}>
          <CalendarView 
            monthlySchedules={monthlySchedules}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            groupId={groupId}
          />
        </div>
      </main>
    </div>
  );
};

export default Schedule;