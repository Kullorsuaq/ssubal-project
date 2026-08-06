import { Link, useParams } from 'react-router-dom';
import usePopup from '../hooks/usePopup';
import styles from './Board.module.css';

const Board = ({ results = [], detailBtnContent, onDetailBtnClick, page, loading }) => {
  const { openPopup } = usePopup();
  const hasDetailButton = !!onDetailBtnClick;

  if (loading || !results || results.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyText}>{loading ? '목록 불러오는 중...' : '목록이 비어 있습니다.'}</p>
      </div>
    );
  }

  return (
    <div className={styles.boardContainer}>
      <ul className={styles.boardList}>
        {results.map((result) => {
          const destination = hasDetailButton
            ? '#!'
            : page
            ? `${page}/${result.id}`
            : `${result.id}`;

          return (
            <li key={result.id} className={styles.boardItem}>
              <Link to={destination} className={styles.itemLink}>
                <div className={styles.itemMain}>
                  {result.status && (
                    <span
                      className={`${styles.statusBadge} ${
                        result.status === 'RECRUITING'
                          ? styles.statusRecruiting
                          : styles.statusClosed
                      }`}
                    >
                      {result.status === 'RECRUITING' ? '구인 중' : '마감'}
                    </span>
                  )}
                  <span className={styles.itemTitle}>
                    {result.title || result.name}
                  </span>
                </div>
              </Link>

              {hasDetailButton && (
                <button
                  type="button"
                  className={styles.detailButton}
                  onClick={() => {
                    openPopup({
                      title: result.name,
                      content: result.description,
                      confirmBtnContent: detailBtnContent,
                      onConfirm: () => onDetailBtnClick(result.id, result.name),
                    });
                  }}
                >
                  상세 보기
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Board;