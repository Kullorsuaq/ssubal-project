import Profile from '../../components/Profile';
import useAuth from '../../hooks/useAuth';
import styles from './ApplicantList.module.css';

const ApplicantList = ({ isWriter, applicants, onAcceptBtnClick }) => { 
  const { user } = useAuth();
  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>지원자 목록</h2>
      <ul className={styles.list}>
        {applicants.map((app) => (
          <li key={app.id} className={styles.item}>
            <Profile 
              userId={app.applicant_id} 
              name={app.applicant_name} 
              profileImage={app.applicant_profile_img} //Profile 컴포넌트의 props 명칭에 맞춤
            /> 
            {/* applicant_id는 users의 id */}
            
            {app.status === 'PENDING' && isWriter && (
              <button 
                className={styles.acceptBtn} 
                onClick={() => onAcceptBtnClick(app.id)}
              >
                지원 수락
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ApplicantList;