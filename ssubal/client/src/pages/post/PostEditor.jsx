import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ReactDOM from 'react-dom';
import useAuth from '../../hooks/useAuth';
import usePopup from '../../hooks/usePopup';
import useCalendar from '../../hooks/useCalendar';
import { getTodayString } from '../../../utils';
import { createPost, editPost } from '../../api/post';
import { formatToInputDate, formatToInputTime } from '../../../utils';
import CalendarView from '../../components/schedule/CalendarView';
import styles from './PostEditor.module.css';

const PostEditor = () => {
  const { user } = useAuth();
  const { openPopup } = usePopup();
  const { monthlySchedules, currentDate, setCurrentDate } = useCalendar();

  const navigate = useNavigate();
  const { groupId, postId } = useParams();
  const isEditMode = !!postId;
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    content: '',
    wage: '', 
    scheduleId: '',
    isAlert: false
  });

  useEffect(() => {
    if(isEditMode && location.state?.post) { 
      const { post } = location.state; 
      setFormData({
        title: post.title || '',
        date: formatToInputDate(post.date) || '',
        startTime: formatToInputTime(post.start_time) || '',
        endTime: formatToInputTime(post.end_time) || '',
        content: post.content || '',
        wage: post.wage || '',
        scheduleId: post.schedule_id || '',
        isAlert: false
      });
    }
  }, [isEditMode, location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (schedule) => {
    if (schedule) {
      const isNotUserSchedule = user.id !== schedule.worker_id;
      if (isNotUserSchedule) {
        openPopup({ title: '권한 없음', content: '자신의 스케줄만 선택할 수 있습니다.' });
        return;
      }

      setFormData((prev) => ({ 
        ...prev, 
        scheduleId: schedule.id,
        date: formatToInputDate(schedule.date) || '',
        startTime: formatToInputTime(schedule.start_time) || '',
        endTime: formatToInputTime(schedule.end_time) || '',
        wage: schedule.wage || ''
      }));

      setIsCalendarOpen(false);      
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { title, date, startTime, endTime, wage, content } = formData;

    if(!title.trim() || !date || !startTime || !endTime || !wage || Number(wage) <= 0 || !content.trim()) {
      setFormData(prev => ({...prev, isAlert: true}));
      return;
    } 

    const now = new Date();
    const startDateTime = new Date(`${date}T${startTime}`);
    let endDateTime = new Date(`${date}T${endTime}`);

    if (startDateTime < now) {
      openPopup({ title: '시간 오류', content: '현재 시간 이전의 스케줄로는 대타를 구할 수 없습니다.' });
      return; 
    }

    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    const timeDiffHours = (endDateTime - startDateTime) / (1000 * 60 * 60);

    if (startDateTime.getTime() === endDateTime.getTime()) {
      openPopup({ title: '시간 오류', content: '시작 시간과 끝 시간이 같을 수 없습니다.' });
      return;
    }

    if (timeDiffHours > 24) {
      openPopup({ title: '시간 오류', content: '근무 시간은 최대 24시간을 초과할 수 없습니다.' });
      return;
    }

    if (timeDiffHours < 0.5) {
      openPopup({ title: '시간 오류', content: '근무 시간은 최소 30분 이상이어야 합니다.' });
      return;
    }

    setFormData(prev => ({...prev, isAlert: false}));
    setLoading(true);

    try {
      const { isAlert, ...postData } = formData;

      if(isEditMode) {
        const res = await editPost(groupId, postId, postData);
        if(res.data.code === "POST_UPDATED_SUCCESS") {
          navigate(`../`, { relative: 'path' });
        }
      } else {
        const res = await createPost(groupId, postData); 
        if(res.data.code === "POST_CREATED_SUCCESS") {
          const createdPost = res.data.data.post_id; 
          navigate(`../${createdPost}`, { relative: 'path' });
        } 
      }
    } catch(error) {
      console.error(error);
      const modeText = isEditMode ? '수정' : '작성';

      if (error.response && error.response.data.code === "NOT_GROUP_MEMBER") {
        openPopup({ title: "권한 없음", content: `해당 그룹의 멤버가 아니므로 글을 ${modeText}할 수 없습니다.` });
      }
      if (error.response && error.response.data.code === "SCHEDULE_ID_REQUIRED") {
        openPopup({ title: "근무 스케줄 선택 필요", content: "근무 스케줄은 직접 입력할 수 없습니다." });
      }
      if (error.response && error.response.data.code === "SCHEDULE_NOT_FOUND") {
        openPopup({ title: "존재하지 않는 근무 스케줄", content: `존재하는 근무 스케줄이 아니므로 글을 ${modeText}할 수 없습니다.` });
      }
      if (error.response && error.response.data.code === "NOT_SCHEDULE_OWNER") {
        openPopup({ title: "권한 없음", content: "자신의 근무 스케줄만 선택할 수 있습니다." });
      }
      if(error.response && error.response.data.code === "POST_NOT_FOUND") {
        openPopup({ title: "존재하지 않는 글", content: "존재하지 않는 글입니다." });
        navigate(`/groups/${groupId}/posts`);
      }
      if(error.response && error.response.data.code === "NOT_POST_WRITER") {
        openPopup({ title: "권한 없음", content: "작성자만 글을 수정할 수 있습니다." });
      }
      if(error.response && error.response.data.code === "SERVER_ERROR") {
        openPopup({ title: "서버 에러", content: `글 ${modeText} 중 문제가 발생했습니다.` });
      }
    } finally {
      setLoading(false);
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
        <h1 className={styles.title}>{isEditMode ? '대타 모집 글 수정' : '대타 모집 글 작성'}</h1>
      </header>

      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.form}>
          
          {formData.isAlert && !formData.title && (<p className={styles.errorText}>제목을 입력해주세요.</p>)}
          <input
            type="text"
            id="title"
            name="title"
            placeholder='제목을 입력하세요'
            className={styles.input}
            value={formData.title}
            disabled={loading}
            onChange={handleChange}
          />
          
          <hr className={styles.divider} />

          {formData.isAlert && !formData.date && (<p className={styles.errorText}>대타 날짜를 선택해주세요.</p>)}
          <label htmlFor="date" className={styles.label}>대타 날짜</label>
          <div className={styles.rowGroup}>
            <input
              type="date"
              id="date"
              name="date"
              min={getTodayString()}
              className={styles.input}
              value={formData.date}
              disabled={loading}
              onChange={handleChange}
              readOnly
            />
            <button type="button" className={styles.btnSecondary} onClick={() => setIsCalendarOpen(true)}>기존 근무에서 선택</button>
          </div>    

          {formData.isAlert && !formData.startTime && (<p className={styles.errorText}>근무 시작 시간을 선택해주세요.</p>)}    
          <label htmlFor="start-time" className={styles.label}>근무 시작 시간</label>
          <input
            type="time"
            id="start-time"
            name="startTime"
            className={styles.input}
            value={formData.startTime}
            disabled={loading}
            onChange={handleChange}
            readOnly
          />

          {formData.isAlert && !formData.endTime && (<p className={styles.errorText}>근무 끝 시간을 선택해주세요.</p>)}
          <label htmlFor="end-time" className={styles.label}>근무 끝 시간</label>
          <input
            type="time"
            id="end-time"
            name="endTime"
            className={styles.input}
            value={formData.endTime}
            disabled={loading}
            onChange={handleChange}
            readOnly
          />

          {formData.isAlert && (!formData.wage || Number(formData.wage) <= 0) && (<p className={styles.errorText}>시급을 입력해주세요.</p>)}
          <label htmlFor="wage" className={styles.label}>시급</label>
          <input
            type="number"
            id="wage"
            name="wage"
            placeholder='시급을 입력하세요'
            className={styles.input}
            value={formData.wage}
            disabled={loading}
            onChange={handleChange}
          />

          <hr className={styles.divider} />

          {formData.isAlert && !formData.content && (<p className={styles.errorText}>내용을 입력해주세요.</p>)}
          <label htmlFor="content" className={styles.label}>내용</label>
          <textarea 
            id="content"
            name="content"
            placeholder='내용을 입력하세요'
            className={styles.textarea}
            value={formData.content}
            disabled={loading}
            onChange={handleChange}
            rows="10"
          />

          <button type="submit" className={styles.btnPrimary}>{isEditMode ? '수정' : '작성'}</button>
        </form>
      </div>

      {isCalendarOpen && ReactDOM.createPortal(
        <div className={styles.calendarModalOverlay} onClick={() => setIsCalendarOpen(false)}>
          <div className={styles.calendarModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>근무 스케줄 선택</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setIsCalendarOpen(false)}>✕</button>
            </div>
            <CalendarView 
              monthlySchedules={monthlySchedules} 
              currentDate={currentDate} 
              setCurrentDate={setCurrentDate} 
              onHandleSelect={handleSelect} 
              groupId={groupId}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PostEditor;