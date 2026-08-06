import React from 'react';
import styles from './Pagination.module.css';

function Pagination({ page, setPage, total, limit = 10, loading }) {
  const totalPage = Math.ceil(total / limit) || 1; 
  
  const startPage = Math.floor((page - 1) / 5) * 5 + 1;
  const endPage = Math.min(startPage + 4, totalPage);
  const hasMore = endPage < totalPage;

  const pageNums = [];
  for(let i = startPage; i <= endPage; i++) {
    pageNums.push(i);
  }

  return (
    <div className={styles.paginationContainer}>
      <button
        className={styles.pageArrowButton}
        disabled={loading || startPage === 1}
        onClick={() => setPage(Math.floor((page - 1) / 5) * 5)}
      >
        ◀
      </button>

      <div className={styles.pageNumbers}>
        {pageNums.map((num) => (
          <button
            key={num}
            className={`${styles.pageButton} ${page === num ? styles.active : ''}`}
            disabled={loading}
            onClick={() => setPage(num)}
          >
            {num}
          </button>
        ))} 
      </div>

      <button
        className={styles.pageArrowButton}
        disabled={loading || !hasMore}
        onClick={() => setPage(startPage + 5)}
      >
        ▶
      </button> 
    </div>
  );
}

export default Pagination;