import { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import usePopup from '../../hooks/usePopup';
import useCalendar from '../../hooks/useCalendar';
import useAuth from '../../hooks/useAuth';
import useRole from '../../hooks/useRole';
import styles from './CalendarDetail.module.css';
import AddList from '../AddList';
import { getGroupParticipants } from '../../api/group';
import { updateSchedule } from '../../api/schedule';
import { NotificationContext } from '../../contexts/NotificationContext';

const CalendarDetail = ({ monthlySchedules, selectedDate, isModalOpen, setIsModalOpen, onHandleSelect, onSubmit, groupId }) => { 
  const { selectedGroup } = useAuth();
  const navigate = useNavigate();
  const { isOwner, isAdmin } = useRole();
  const isEditable = isOwner || isAdmin;
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const { notiSocket } = useContext(NotificationContext);

  const location = useLocation();
  const mode = location.pathname.includes('/posts/create') ? 'SELECT' : 'EDIT';

  const { openPopup, closePopup } = usePopup();

  const [loading, setLoading] = useState(false);
  const [daySchedulesList, setDaySchedulesList] = useState([]);

  const [fields, setFields] = useState([
    {name: 'position', label: '직책', type: 'text'},
    {name: 'worker_id', label: '근무자 선택', type: 'select', options: []},
    {name: 'start_time', label: '근무 시작 시간', type: 'time'},
    {name: 'end_time', label: '근무 끝 시간', type: 'time'},
    {name: 'wage', label: '시급', type: 'number'},
    {name: 'is_fixed', label: '고정 근무로 등록', type: 'checkbox'}
  ]); 

  useEffect(() => { 
    if(selectedDate && monthlySchedules) {
      const rawSchedules = monthlySchedules[selectedDate] || [];

      const formattedSchedules = rawSchedules.map(sc => ({
        ...sc,
        ['start_time']: sc['start_time'] === '24:00:00' ? '00:00' : sc['start_time'],
        ['end_time']: sc['end_time'] === '24:00:00' ? '00:00' : sc['end_time'],
        ['is_fixed']: sc['id'] && String(sc.id).includes('fixed')
      }));

      setDaySchedulesList(formattedSchedules);
    } 
  }, [monthlySchedules, selectedDate, groupId]);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const res = await getGroupParticipants(groupId);
        
        if(res.data.code === "FETCH_PARTICIPANTS_SUCCESS") {
          const options = res.data.data;
          const formattedOptions = [
            { value: '', label: '선택 없음' },
            ...options.map(opt => ({ value: opt.user_id, label: opt.name, participant_id: opt.participant_id }))
          ];

          setFields(prev => prev.map(field => field.name === 'worker_id' ? { ...field, options: formattedOptions } : field));
        }
      } catch(error) {
        if (error.response && error.response.data.code === "NOT_GROUP_MEMBER") {
          openPopup({
            title: "권한 없음",
            content: "해당 그룹의 멤버가 아니므로 스케줄을 볼 수 없습니다."
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
    };

    if(groupId && isModalOpen) fetchParticipants();
  }, [groupId, isModalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const filledRows = daySchedulesList.filter(row => 
      fields.some(field => String(row[field.name]).trim() !== '')
    );

    const hasIncompleteRow = filledRows.some(row => 
      fields.some(field => {
        if (field.type === 'checkbox') return false;
        return !row[field.name] || String(row[field.name]).trim() === '';
      })
    );

    if(hasIncompleteRow) {
      openPopup({title: "스케줄 등록 실패", content: "추가하신 근무 스케줄 중 입력하지 않은 항목이 있습니다. 모든 칸을 채우거나 줄을 제거해 주세요."});
      return; 
    }

    let hasOverlap = false;
    let overlappedWorkerName = '';

    for(let i = 0; i < filledRows.length; i++) {
      for(let j = i + 1; j < filledRows.length; j++) {
        const rowA = filledRows[i];
        const rowB = filledRows[j];

        if(rowA.worker_id === rowB.worker_id) {
          const startA = String(rowA.start_time).substring(0, 5);
          const endA = String(rowA.end_time).substring(0, 5);
          const startB = String(rowB.start_time).substring(0, 5);
          const endB = String(rowB.end_time).substring(0, 5);

          const isOverlapped = (startA < endB) && (endA > startB);
          
          if(isOverlapped) {
            hasOverlap = true;
            overlappedWorkerName = rowA.worker_name;
            break;
          }
        }
      }
      if(hasOverlap) break;
    }

    if(hasOverlap) {
      setIsModalOpen(false);
      openPopup({ title: "스케줄 중복 에러", content: `${overlappedWorkerName}님의 근무 시간이 겹칩니다. 시간을 다시 확인해 주세요.` });
      return;
    }

    const rawSchedules = monthlySchedules[selectedDate] || [];
    const existingFixedSchedules = rawSchedules.filter(sc => sc.id && String(sc.id).includes('fixed'));
    const newFlexibleSchedules = filledRows.filter(row => !row.is_fixed);

    let hasFixedFlexibleOverlap = false;

    for(const flex of newFlexibleSchedules) {
      const startFlex = String(flex.start_time).substring(0, 5);
      const endFlex = String(flex.end_time).substring(0, 5);

      const isOverlap = existingFixedSchedules.some(fixed => {
        const isSameWorker = (fixed.worker_id && fixed.worker_id === flex.worker_id);
        if(!isSameWorker) return false;

        const startFixed = String(fixed.start_time).substring(0, 5);
        const endFixed = String(fixed.end_time).substring(0, 5);

        return (startFlex < endFixed) && (endFlex > startFixed);
      });

      if(isOverlap) {
        hasFixedFlexibleOverlap = true;
        break;
      }
    }

    if(hasFixedFlexibleOverlap) {
      setIsModalOpen(false);
      openPopup({ title: "스케줄 중복 에러", content: `기존 고정 근무 시간과 입력한 유동 근무 시간이 겹칩니다. 시간을 다시 확인해 주세요.` });
      return;
    }

    try {
      setLoading(true);
      const dayNum = new Date(selectedDate).getDay();

      const refinedScheduleList = daySchedulesList
        .filter(schedule => schedule.position.trim() !== '')
        .map(({id, type, is_fixed, ...rest}) => ({
          ...rest,
          schedule_type: is_fixed ? 'FIXED' : 'FLEXIBLE', 
          day: is_fixed ? dayNum : null
        }));

      const res = await updateSchedule(groupId, { date: selectedDate, scheduleData: refinedScheduleList });

      if(res.data.code === "SCHEDULE_UPDATE_SUCCESS") {
        openPopup({
          title: "스케줄 업데이트 완료",
          content: "스케줄이 업데이트 되었습니다.",
          confirmBtnContent: '확인', 
          onConfirm: () => { closePopup(); window.location.reload(); }
        });
      }

      setIsModalOpen(false);
      notiSocket.emit('send_notification');
    } catch(error) {
      if (error.response && error.response.data.code === "NOT_GROUP_MEMBER") {
        openPopup({
          title: "권한 없음",
          content: "해당 그룹의 멤버가 아니므로 스케줄을 볼 수 없습니다."
        });
        if(selectedGroup) {
          navigate(`/groups/${selectedGroup.group_id}`);
        } else {
          navigate('/groups');
        }
      }

      if (error.response && error.response.data.code === "UNAUTHORIZED_ACCESS") {
        openPopup({
          title: "권한 없음",
          content: "관리자 또는 그룹장만 스케줄을 업데이트할 수 있습니다."
        });   
      }
      
      if (error.response && error.response.data.code === "SCHEDULE_OVERLAP_ERROR") {
        openPopup({
          title: "스케줄 중복 에러",
          content: "오늘 변경하려는 근무자들 간에 시간이 중복되는 스케줄이 있습니다. 입력한 시간을 다시 확인해 주세요."
        });   
      }

      if(error.response && error.response.data.code === "FIXED_FLEXIBLE_OVERLAP_ERROR") {
        openPopup({
          title: "스케줄 중복 에러",
          content: "기존 고정 근무 시간과 유동 근무 시간이 겹칩니다. 입력한 시간을 다시 확인해 주세요."
        }); 
      }

      if (error.response && error.response.data.code === "FUTURE_SCHEDULE_OVERLAP_ERROR") {
        openPopup({
          title: "스케줄 중복 에러",
          content: "새로 추가하려는 고정 근무 시간대에 이미 대타 근무가 등록되어 있습니다. 대타 스케줄을 먼저 조정해 주세요."
        });   
      }

      if(error.response && error.response.data.code === "SERVER_ERROR") {
        openPopup({title: "서버 에러", content: "잠시 후 다시 시도해 주세요."});
      }

    } finally {
      setLoading(false);
    }
  };

  //모달이 꺼져있으면 렌더링X
  if (!isModalOpen) return null;

  //ReactDOM.createPortal을 사용하여 화면 전체(body 최상단)에 렌더링
  return ReactDOM.createPortal(
    <div className={styles['calendar-modal-overlay']} onClick={() => setIsModalOpen(false)}>
      <form onSubmit={mode === 'EDIT' ? handleSubmit : undefined} onClick={(e) => e.stopPropagation()}>
        <div className={styles['calendar-modal-content']}>
          <div className={styles['modal-header']}>
            <h1>{selectedDate} 스케줄</h1>
            <button type="button" className={styles['close-btn']} onClick={() => setIsModalOpen(false)}>✕</button>
          </div>
          <div className={styles['modal-body']}>
            {fields[1].options.length > 0 ? (
              <AddList fields={fields} dataList={daySchedulesList} setDataList={setDaySchedulesList} mode={mode} selectedDate={selectedDate} onScheduleSelect={setSelectedSchedule} />
            ) : (
              <p>근무자 목록 불러오는 중...</p>
            )}
          </div>
          {mode === 'SELECT' && (<button type="button" className={styles['submit-btn']} onClick={() => { onHandleSelect(selectedSchedule); setIsModalOpen(false); }}>선택</button>)}
          {mode === 'EDIT' && isEditable && (<button type="submit" className={styles['submit-btn']}>스케줄 저장</button>)}
        </div>
      </form>
    </div>,
    document.body
  );
};

export default CalendarDetail;