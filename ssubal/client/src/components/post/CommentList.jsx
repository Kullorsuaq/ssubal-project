import { useState } from 'react';
import Profile from "../Profile";
import CommentForm from "./CommentForm";
import { formatDate } from '../../../utils';
import useAuth from "../../hooks/useAuth";
import styles from './CommentList.module.css';

const CommentList = ({ comments, onSubmitComment, onDeleteComment }) => {
  const { user } = useAuth();
  const [replyingCommentId, setReplyingCommentId] = useState(null);
  
  const handleReplyToggle = (commentId) => {
    setReplyingCommentId((prev) => (prev === commentId ? null : commentId));
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>댓글 ({comments.length})</h2>
      <ul className={styles.list}>
        {comments.map((com) => {
          let itemClassName = styles.normalComment;

          if(com.comment_start !== null) {
            itemClassName = styles.replyComment;
          }

          return (
            <li key={com.comment_id} className={itemClassName}>
              <div className={styles.commentHeader}>
                <Profile 
                  userId={com.comment_writer_id} 
                  name={com.comment_writer_name} 
                  profileImage={com.comment_writer_profile_img} 
                />
                <span className={styles.date}>{formatDate(com.created_at)}</span>
              </div>

              <p className={styles.content}>{com.comment_content}</p>

              <div className={styles.actionButtons}>
                {itemClassName === styles.normalComment && (
                  <button className={styles.actionBtn} onClick={() => handleReplyToggle(com.comment_id)}>
                    답글 달기
                  </button>
                )}
                
                {/* user가 존재할 때만 id를 비교(Cannot read properties of null(reading 'id') 방지) */}
                {user && com.comment_writer_id === user.id && (
                  <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => onDeleteComment(com.comment_id)}>
                    삭제
                  </button>
                )}
              </div>

              {replyingCommentId === com.comment_id && (
                <div className={styles.replyFormWrapper}>
                  <CommentForm parentCommentId={com.comment_id} onSubmitComment={onSubmitComment} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default CommentList;