import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from './useAuth';
import usePopup from '../hooks/usePopup';
import { getMonthlySchedules } from '../api/schedule';

let cachedSchedules = null;
let cachedKey = "";

const useCalendar = (force = false) => { //force(강제 갱신) 기본 값은 false(캐시 사용) 
  const [monthlySchedules, setMonthlySchedules] = useState(cachedSchedules || []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const { selectedGroup, isLogin } = useAuth();
  const { openPopup } = usePopup();
  const { groupId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatas = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const currentRequestKey = `${groupId}-${year}-${month}`;

      //schedule.jsx 페이지 같은 강제 갱신이 아니고 같은 그룹/년/월의 캐시가 있으면 서버 요청 패스하고 캐시 반환
      if(!force && cachedKey === currentRequestKey && cachedSchedules) {
        setMonthlySchedules(cachedSchedules);
        setScheduleLoading(false);
        return;
      }

      try {
        setScheduleLoading(true);
        const res = await getMonthlySchedules(groupId, year, month);
        cachedSchedules = res.data.schedules;
        cachedKey = currentRequestKey;
        setMonthlySchedules(res.data.schedules);
      } catch(error) {
        if (error.response && error.response.data.code === "NOT_GROUP_MEMBER") {
          openPopup({
            title: "권한 없음",
            content: "해당 그룹의 멤버가 아니므로 스케줄을 볼 수 없습니다."
          });

          if(selectedGroup && window.location.pathname !== '/') { //홈일 때는 이동X
            navigate(`/groups/${selectedGroup.group_id}`);
          } else {
            navigate('/');
          }
        }
        
        if(error.response && error.response.data.code === "SERVER_ERROR") {
          openPopup({ title: "서버 에러", content: "스케줄을 불러오지 못했습니다." });
        }
      } finally {
        setScheduleLoading(false);
      }
    };
    
    fetchDatas();
  }, [groupId, currentDate, force]);

  //홈에서 이번주 스케줄 불러올 때 사용
  const getWeeklySchedules = (weekDates) => {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return weekDates.map((dateStr) => {
      const dayName = dayNames[new Date(dateStr).getDay()];
      const daySchedules = monthlySchedules[dateStr] || [];
      const workers = daySchedules.map(ds => ds.worker_name);
      const [month, day] = dateStr.split('-').slice(1);

      return {
        day: dayName,
        date: `${month}/${day}`,
        workers
      };
    });
  };

  return {
    monthlySchedules,
    getWeeklySchedules,
    currentDate,
    setCurrentDate,
    selectedSchedule,
    setSelectedSchedule,
    scheduleLoading
  }
}

export default useCalendar;