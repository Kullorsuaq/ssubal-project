import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPostDetail, createComment, deleteComment, deletePost } from '../../api/post';
import { acceptApplicant, applySchedule} from '../../api/schedule';
import { NotificationContext } from '../../contexts/NotificationContext';
import useAuth from '../../hooks/useAuth';
import usePopup from '../../hooks/usePopup';
import PostContent from '../../components/post/PostContent';
import ApplicantList from '../../components/post/ApplicantList';
import CommentList from '../../components/post/CommentList';
import CommentForm from '../../components/post/CommentForm';
import ApplyButton from '../../components/post/ApplyButton';
import styles from './PostDetail.module.css';

const PostDetail = () => {
  const { groupId, postId } = useParams();
  const [post, setPost] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isApplied, setIsApplied] = useState(false);
  const navigate = useNavigate();
  const { notiSocket } = useContext(NotificationContext);
  const { user, selectedGroup } = useAuth();
  const { openPopup, closePopup } = usePopup();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await getPostDetail(groupId, postId);
        const { post: postData, applicants: applicantData, comments: commentData, isWriter, isApplied } = res.data;

        setPost({ ...postData, isWriter });
        setApplicants(applicantData);
        setComments(commentData);
        setIsApplied(isApplied);
        
        const userApplied = applicantData.some(app => app.applicant_id === user.id); 
        setIsApplied(userApplied);
      } catch(error) {
        if(error.response && error.response.data.code === "POST_NOT_FOUND") {
          openPopup({title: "존재하지 않는 글" , content: "존재하지 않는 글입니다."});
          navigate(`/groups/${groupId}/posts`);
        }

        if (error.response && error.response.data.code === "NOT_GROUP_MEMBER") {
          openPopup({
            title: "권한 없음",
            content: "해당 그룹의 멤버가 아니므로 글을 볼 수 없습니다."
          });
          if(selectedGroup) {
            navigate(`/groups/${selectedGroup.group_id}`);
          } else {
            navigate('/groups');
          }
        }

        if(error.response && error.response.data.code === "SERVER_ERROR") {
          openPopup({title: "서버 에러", content: "글을 불러오는 중 문제가 생겼습니다." });
        }
      } finally {
        setLoading(false);
      }
    }
    
    if(postId) fetchDetail();
  }, [groupId, postId]);

  const isWriter = post && post.isWriter; 

  const openApplicantAccept = (applicantId) => {
    openPopup({
      title: '지원자 수락', 
      content: '한 번 수락하면 취소할 수 없습니다. 지원 수락하시겠습니까?', 
      confirmBtnContent: '확인', 
      onConfirm: () => { handleApplicantAccept(applicantId); }
    });
  }

  const handleApplicantAccept = async (applicantId) => {
    try {
      const res = await acceptApplicant(groupId, applicantId);
    
      if(res.data.code === "APPLICANT_ACCEPTED_SUCCESS") {
        openPopup({title: "지원자 수락", content: "지원이 수락되었으며, 해당 스케줄이 등록되었습니다."});
        setApplicants((prev) => 
          prev.map((app) => 
            app.id === applicantId
              ? { ...app, status: 'ACCEPTED'}
              : { ...app, status: 'REJECTED'}
          )
        );
        const responseApplicantId = res.data.applicantId;
        setPost((prev) => prev ? { ...prev, status: 'CLOSED' } : null);

        notiSocket.emit('send_notification', responseApplicantId);
      }
    } catch(error) {
      if(error.response && error.response.data.code === "APPLICANT_NOT_FOUND") {
        openPopup({title: "존재하지 않는 지원서", content: "존재하지 않는 지원서입니다."});
      }

      if(error.response && error.response.data.code === "SCHEDULE_OVERLAP_ERROR") {
        const targetApplicant = applicants.find(app => app.id === applicantId);
        const applicantName = targetApplicant ? targetApplicant.applicant_name : "지원자";
        openPopup({title: "스케줄 중복 에러", content: `${applicantName}님의 근무가 이미 존재합니다. 스케줄을 다시 확인해 주세요.`});
      }

      if(error.response && error.response.data.code === "SERVER_ERROR") {
        openPopup({title: "서버 에러", content: "잠시 후 다시 시도해 주세요."});
      }
    }
  }

  const openCommentSubmit = (parentCommentId, content) => {
    openPopup({
      title: '댓글 등록', 
      content: '댓글을 등록하시겠습니까?', 
      confirmBtnContent: '확인', 
      onConfirm: () => { closePopup(); handleCommentSubmit(parentCommentId, content); }
    });
  }

  const handleCommentSubmit = async (parentCommentId, content) => {
    try {
      const commentData = { parentCommentId, content };
      const res = await createComment(groupId, postId, commentData);

      if(res.data.code === "COMMENT_CREATED_SUCCESS") {
        setComments(res.data.data);
        const newComment = res.data.newComment;
        
        if(newComment.comment_writer_id !== post.writer_id) {
          notiSocket.emit('send_notification', post.writer_id);
        }
      }
    } catch(error) {
      if(error.response && error.response.data.code === "NOT_GROUP_MEMBER") {
        openPopup({title: "댓글 등록" , content: "그룹 멤버만 댓글을 달 수 있습니다."});
      }
      if(error.response && error.response.data.code === "SERVER_ERROR") {
        openPopup({title: "서버 에러", content: "잠시 후 다시 시도해 주세요."});
      }
    }
  }

  const openCommentDelete = (commentId) => {
    openPopup({
      title: '댓글 삭제', 
      content: '댓글을 삭제하시겠습니까?', 
      confirmBtnContent: '확인', 
      onConfirm: () => { closePopup(); handleCommentDelete(commentId); }
    });
  }

  const handleCommentDelete = async (commentId) => {
    try {
      const res = await deleteComment(groupId, postId, commentId);
      if(res.data.code === "COMMENT_DELETED_SUCCESS") {
        setComments(res.data.data); 
      }
    } catch(error) {
      if(error.response && error.response.data.code === "NOT_GROUP_MEMBER") {
        openPopup({title: "권한 없음" , content: "그룹 멤버만 댓글을 달 수 있습니다."});
      }
      if(error.response && error.response.data.code === "COMMENT_NOT_FOUND") {
        openPopup({title: "존재하지 않는 댓글" , content: "존재하지 않는 댓글입니다."});
      }
      if(error.response && error.response.data.code === "NOT_COMMENT_WRITER") {
        openPopup({title: "권한 없음" , content: "작성자만 댓글을 삭제할 수 있습니다."});
      }
      if(error.response && error.response.data.code === "SERVER_ERROR") {
        openPopup({title: "서버 에러", content: "잠시 후 다시 시도해 주세요."});
      }
    }
  }

  const openPostEdit = () => {
    openPopup({
      title: '글 수정', 
      content: '글을 수정하시겠습니까?', 
      confirmBtnContent: '확인', 
      onConfirm: () => { closePopup(); handlePostEdit(); }
    });
  }

  const handlePostEdit = () => {
    navigate(`/groups/${groupId}/posts/${postId}/edit`, { state: { post }});
  }

  const openPostDelete = () => {
    openPopup({
      title: '글 삭제', 
      content: '글을 삭제하시겠습니까?', 
      confirmBtnContent: '확인', 
      onConfirm: () => { closePopup(); handlePostDelete(); }
    });
  }

  const handlePostDelete = async () => {
    try {
      const res = await deletePost(groupId, postId);
      if(res.data.code === "POST_DELETED_SUCCESS") {
        navigate(`/groups/${groupId}/posts`);
      }
    } catch(error) {
      if(error.response && error.response.data.code === "NOT_GROUP_MEMBER") {
        openPopup({title: "권한 없음" , content: "그룹 멤버만 글을 볼 수 있습니다."});
      }
      if(error.response && error.response.data.code === "POST_NOT_FOUND") {
        openPopup({title: "존재하지 않는 글" , content: "존재하지 않는 글입니다."});
      }
      if(error.response && error.response.data.code === "NOT_POST_WRITER") {
        openPopup({title: "권한 없음" , content: "작성자만 글을 삭제할 수 있습니다."});
      }
      if(error.response && error.response.data.code === "SERVER_ERROR") {
        openPopup({title: "서버 에러", content: "잠시 후 다시 시도해 주세요."});
      }
    }
  }

  const openApplyPost = () => {
    openPopup({
      title: '지원하기', 
      content: '한 번 지원하면 취소할 수 없습니다. 지원하시겠습니까?', 
      confirmBtnContent: '확인', 
      onConfirm: () => { closePopup(); handleApplyPost(); }
    });
  }

  const handleApplyPost = async () => {
    try {
      const applicantData = { postId };
      const res = await applySchedule(groupId, applicantData);
      if(res.data.code === "APPLY_SUCCESS") {
        const { isApplied, applicants } = res.data;
        setApplicants(prev => [...prev, applicants]);
        setIsApplied(isApplied); 

        notiSocket.emit('send_notification', post.writer_id);
      }
    } catch(error) {
      if(error.response && error.response.data.code === "NOT_GROUP_MEMBER") {
        openPopup({title: "권한 없음" , content: "그룹 멤버만 글을 볼 수 있습니다."});
      }
      if(error.response && error.response.data.code === "POST_NOT_FOUND") {
        openPopup({title: "존재하지 않는 글" , content: "존재하지 않는 글입니다."});
      }
      if(error.response && error.response.data.code === "POST_ALREADY_CLOSED") {
        openPopup({title: "지원 마감" , content: "이미 지원 마감된 글입니다."});
      }
      if(error.response && error.response.data.code === "CANNOT_APPLY_OWN_POST") {
        openPopup({title: "내 게시글에 지원" , content: "본인이 작성한 글에는 지원할 수 없습니다."});
      }
      if(error.response && error.response.data.code === "ALREADY_APPLIED") {
        openPopup({title: "이미 지원한 글" , content: "이미 지원한 글입니다."});
      }
      if(error.response && error.response.data.code === "SERVER_ERROR") {
        openPopup({title: "서버 에러", content: "잠시 후 다시 시도해 주세요."});
      }
    }
  }

  return (
    <div className={styles.postDetailContainer}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => navigate(`/groups/${groupId}/posts`)} className={styles.backButton}>
            ←
          </button>
          <h1 className={styles.pageTitle}>목록</h1>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.miniLogo}>🧩</span>
        </div>
      </header>

      <div className={styles.mainContent}>
        <PostContent 
          isWriter={isWriter} 
          loading={loading} 
          post={post} 
          onEditBtnClick={openPostEdit} 
          onDeleteBtnClick={openPostDelete} 
        />
        {post && (
          <ApplicantList 
            isWriter={isWriter} 
            applicants={applicants} 
            onAcceptBtnClick={openApplicantAccept}
          />
        )}
        <CommentList 
          comments={comments} 
          onSubmitComment={openCommentSubmit} 
          onDeleteComment={openCommentDelete} 
        />
        <CommentForm 
          parentCommentId={null} 
          onSubmitComment={openCommentSubmit}
        />
        {post && !isWriter && (
          <ApplyButton 
            isWriter={isWriter} 
            post={post} 
            isApplied={isApplied} 
            onApplyBtnClick={openApplyPost} 
          />
        )}
      </div>
    </div>
  );
};

export default PostDetail;