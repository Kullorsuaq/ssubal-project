import styles from './Notification.module.css';

const Notification = ({ isNotiOpen, setIsNotiOpen, notifications, onNotiClick }) => {
  return (
    <div className={`${styles.notificationOverlay} ${isNotiOpen ? styles.open : ''}`}>
      <div className={styles.backdrop} onClick={() => setIsNotiOpen(false)} />

      <div className={styles.drawer}>
        <div className={styles.header}>
          <h3>알림</h3>
          <button type="button" className={styles.closeBtn} onClick={() => setIsNotiOpen(false)}>
            ✕
          </button>
        </div>

        <ul className={styles.list}>
          {notifications.map(noti => {
            let notiTitle, notiBody, page;
            if(noti.type === "NEW_COMMENT") {
              notiTitle = `새로운 댓글이 달렸습니다. - ${noti.metadata.postTitle}`;
              notiBody = `${noti.metadata.writerName}님: ${noti.metadata.commentContent}`;
              page = `posts/${noti.metadata.postId}`;
            }
            if(noti.type === "SCHEDULE_UPDATE") {
              notiTitle = `스케줄이 업데이트되었습니다.`;
              notiBody = `스케줄 정보가 업데이트되었습니다.`;
              page = `schedules`;
            }
            if(noti.type === "POST_SUB_ACCEPT") {
              notiTitle = `대타 지원 수락되었습니다. - ${noti.metadata.postTitle}`;
              notiBody = `지원하신 대타 근무가 확정되었습니다.`;
              page = `posts/${noti.metadata.postId}`;
            }
            if(noti.type === "POST_SUB_APPLY") {
              notiTitle = `새로운 대타 지원자가 있습니다. - ${noti.metadata.postTitle}`;
              notiBody = `${noti.metadata.applicantName}님이 근무에 지원하셨습니다.`;
              page = `posts/${noti.metadata.postId}`;
            }
            return (
              <li 
                key={noti.id} 
                onClick={() => onNotiClick(noti.id, page)} 
                className={styles.notiItem}
                style={{ color: noti.is_read === 0 ? undefined : "gray" }}
              >
                {noti.is_read === 0 && <span className={styles.badge} />}
                
                <div className={styles.content}>
                  <strong>{notiTitle}</strong>
                  <p>{notiBody}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default Notification;