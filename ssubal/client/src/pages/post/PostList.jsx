import React from 'react';
import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from "../../hooks/useAuth";
import useBoard from '../../hooks/useBoard';
import Pagination from '../../components/Pagination';
import SearchBar from '../../components/SearchBar';
import Board from '../../components/Board';
import { getPosts } from "../../api/post";
import styles from './PostList.module.css';

const PostList = () => {
  const { user, selectedGroup } = useAuth();
  const { groupId } = useParams();
  const navigate = useNavigate();

  const boardParams = useMemo(() => ({
      groupId: groupId || selectedGroup?.group_id,
    }), [groupId, selectedGroup]);
    
  const { results, keyword, setKeyword, page, setPage, totalCount, boardLoading } = useBoard(getPosts, boardParams);
    
  return (
    <div className={styles.postContainer}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>대타 모집 게시판</h1>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.miniLogo}>🧩</span>
        </div>
      </header>

      <div className={styles.mainContent}>
        <div className={styles.searchSection}>
          <SearchBar 
            keyword={keyword}
            setKeyword={setKeyword}
            loading={boardLoading}
            placeholder="어떤 대타를 찾으시나요?"
          />
        </div>

        <div className={styles.boardSection}>
          <Board results={results} loading={boardLoading} />
        </div>

        <div className={styles.paginationSection}>
          <Pagination
            page={page}
            setPage={setPage}
            total={totalCount}
            loading={boardLoading}
          />
        </div>
      </div>

      <button
        className={styles.writeButton}
        onClick={() => navigate(`/groups/${groupId}/posts/create`)}
      >
        ✏️ 글쓰기
      </button>
    </div>
  );
};

export default PostList;