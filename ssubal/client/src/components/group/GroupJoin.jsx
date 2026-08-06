import useAuth from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import styles from "./GroupJoin.module.css";

function GroupJoin() {
  const { user, selectedGroup } = useAuth();

  return (
    <>
      {!selectedGroup && (
        <div className={styles.container}>
          <div className={styles.card}>
            <p className={styles.description}>그룹을 직접 만들거나 가입해 주세요.</p>
            
            <div className={styles.buttonGroup}>
              <Link to="/groups/create" className={styles.primaryLink}>
                알바 그룹 직접 만들기
              </Link>
              
              <Link to="/groups/search" className={styles.secondaryLink}>
                알바처 검색하기
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GroupJoin;