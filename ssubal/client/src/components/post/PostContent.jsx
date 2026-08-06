import Profile from '../../components/Profile';
import { formatTime, formatDate, formatDateTime, formatWage, isFutureSchedule } from '../../../utils';
import styles from './PostContent.module.css';

const PostContent = ({ isWriter, loading, post, onEditBtnClick, onDeleteBtnClick }) => {

  if(loading) return <div className={styles.loadingBox}><p>게시글을 불러오는 중입니다...</p></div>
  if(!loading && !post) return <div className={styles.loadingBox}><p>게시글을 불러올 수 없습니다.</p></div>
  
  return (
    <div className={styles.container}>
      <div className={styles.headerTop}>
        <span className={`${styles.statusBadge} ${post.status === 'RECRUITING' ? styles.recruiting : styles.closed}`}>
          {post.status === 'RECRUITING' ? '구인 중' : '마감'}
        </span>
        <span className={styles.createdAt}>{formatDateTime(post.created_at)}</span>
      </div>

      <h1 className={styles.title}>{post.title}</h1>

      <div className={styles.writerProfile}>
        <Profile userId={post.writer_id} name={post.writer_name} profileImage={post.profile_img} />
      </div>

      <div className={styles.infoBox}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>근무 일자</span>
          <span className={styles.infoValue}>{formatDate(post.date)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>근무 시간</span>
          <span className={styles.infoValue}>{formatTime(post.start_time)} ~ {formatTime(post.end_time)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>책정 시급</span>
          <span className={styles.infoValue}>{formatWage(post.wage)}</span>
        </div>
      </div>

      <div className={styles.contentBody}>
        <p>{post.content}</p>
      </div>

      {(isWriter && isFutureSchedule(post.date, post.start_time) || isWriter) && (
        <div className={styles.actionButtons}>
          {isWriter && isFutureSchedule(post.date, post.start_time) && (
            <button className={styles.editBtn} onClick={onEditBtnClick}>글 수정</button>
          )}
          {isWriter && (
            <button className={styles.deleteBtn} onClick={onDeleteBtnClick}>글 삭제</button>
          )}
        </div>
      )}
    </div>
  )
}

export default PostContent;