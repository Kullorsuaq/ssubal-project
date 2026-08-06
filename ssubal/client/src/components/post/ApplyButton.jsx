import styles from './ApplyButton.module.css';

const ApplyButton = ({ isWriter, post, isApplied, onApplyBtnClick }) => {
  const canApply = !isWriter && post.status === "RECRUITING";

  const isDisabled = !canApply || isApplied;

  const getButtonText = () => {
    if (isApplied) return "지원 완료";
    if (post.status === "RECRUITING") return "지원하기";
    return "지원 마감";
  };

  return (
    <div className={styles.container}>
      {!isWriter && (
        <button 
          type="button" 
          className={styles.applyBtn} 
          onClick={onApplyBtnClick} 
          disabled={isDisabled}
        >
          {getButtonText()}
        </button>
      )}
    </div>
  );
};

export default ApplyButton;