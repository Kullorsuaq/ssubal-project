import React from 'react';
import styles from './WeeklyStatusBoard.module.css';

const WeeklyStatusBoard = ({ weeklySchedules }) => {
  const todayDate = new Date().getDate();

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {weeklySchedules.map((item, index) => {
          const isToday = item.date === todayDate; 
          const isSun = item.day === '일';
          const isSat = item.day === '토';

          return (
            <div 
              key={index} 
              className={`${styles.dayColumn} ${isToday ? styles.todayColumn : ''}`}
            >
              <div className={`${styles.header} ${isToday ? styles.todayHeader : ''}`}>
                <span 
                  className={`
                    ${styles.dayText} 
                    ${isToday ? styles.todayText : ''} 
                    ${isSun ? styles.sunText : ''} 
                    ${isSat ? styles.satText : ''}
                  `}
                >
                  {item.day}
                </span>
                <span className={styles.dateText}>
                  {item.date}
                </span>
              </div>

              <div className={styles.workerList}>
                {item.workers && item.workers.length > 0 ? (
                  item.workers.map((name, wIdx) => (
                    <span key={wIdx} className={styles.workerBadge}>
                      {name}
                    </span>
                  ))
                ) : (
                  <span className={styles.emptyText}></span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyStatusBoard;