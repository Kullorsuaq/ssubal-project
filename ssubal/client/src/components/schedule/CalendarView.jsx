import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import CalendarDetail from './CalendarDetail';
import useCalendar from '../../hooks/useCalendar';
import styles from '../../components/schedule/CalendarView.module.css';
import { formatToInputDate } from '../../../utils';

const CalendarView = ({ monthlySchedules, currentDate, setCurrentDate, onHandleSelect, onSubmit, groupId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const location = useLocation(); 
  const isInPopup = location.pathname.includes('/posts/create');

  const formatDate = (locale, date) => {
    const dateStr = formatToInputDate(date);
    const dayNum = date.getDate().toString();

    if(monthlySchedules && monthlySchedules[dateStr] && monthlySchedules[dateStr].length > 0) {
      const daySchedules = monthlySchedules[dateStr];

      const uniqueSchedules = daySchedules.filter((ds, index, self) => 
        index === self.findIndex((t) => t.worker_name === ds.worker_name)
      );

      return (
        <div className={styles['day-cell']}>
          <span className={styles['day-num']}>{dayNum}</span>
        
          <div className={styles['worker-list']}>
            {uniqueSchedules.map(ds => (
              <span
                key={ds.id}
                className={`${styles['worker-bedge']} ${ds.type === 'FIXED' ? styles['fixed'] : styles['flexible']}`}
              >
                {ds.worker_name}
              </span>
            ))}
          </div>
        </div>
      );       
    }

    return dayNum;
  }

  const handleClickDay = (value) => {
    const dateStr = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    setSelectedDate(dateStr);
    setIsModalOpen(true);
  }

  const handleMonthChange = ({ activeStartDate, view }) => {
    if(view === "month" && activeStartDate) {
      setCurrentDate(activeStartDate);   
    }
  }

  return (
    <div className={styles['calendar-container']}>
      <div className={styles['calendar-header-info']}>
        <div className={styles['title-box']}>
          <p className={styles['calendar-subtitle']}>{isInPopup ? '근무를 선택하세요.' : '날짜를 클릭하여 상세 근무를 확인하거나 등록해 보세요.'}</p>
        </div>
        
        <div className={styles['legend-box']}>
          <div className={styles['legend-item']}>
            <span className={`${styles['legend-dot']} ${styles['fixed-dot']}`}></span>
            <span>고정 근무</span>
          </div>
          <div className={styles['legend-item']}>
            <span className={`${styles['legend-dot']} ${styles['flexible-dot']}`}></span>
            <span>대타 근무</span>
          </div>
        </div>
      </div>

      <Calendar 
        value={currentDate} 
        formatDay={formatDate} 
        onClickDay={handleClickDay}
        onActiveStartDateChange={handleMonthChange}
      />   

      <CalendarDetail 
        monthlySchedules={monthlySchedules}
        selectedDate={selectedDate}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen} 
        onHandleSelect={onHandleSelect}
        groupId={groupId}
       />
    </div>
  )
}

export default CalendarView;