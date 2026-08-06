import { useState } from 'react';
import usePopup from "../../hooks/usePopup";
import useAuth from "../../hooks/useAuth"; 
import styles from './CommentForm.module.css';

const CommentForm = ({ parentCommentId = null, onSubmitComment }) => {
  const { openPopup } = usePopup();
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if(content.trim() === '') {
      openPopup({title: "경고", content: "댓글 내용을 입력해 주세요."});
      return;
    }

    onSubmitComment(parentCommentId, content);
    setContent('');
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <textarea 
        className={styles.textarea}
        value={content} 
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentCommentId ? "답글을 입력해 주세요..." : "댓글을 입력해 주세요..."}
      />
      <div className={styles.buttonWrapper}>
        <button type="submit" className={styles.submitBtn}>등록</button>
      </div>
    </form>
  )
}

export default CommentForm;