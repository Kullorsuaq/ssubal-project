import { useNavigate } from 'react-router-dom';
import { getGroups, verifyGroupPassword, groupSignup } from '../../api/group';
import usePopup from "../../hooks/usePopup";
import useAuth from "../../hooks/useAuth";
import useBoard from '../../hooks/useBoard';
import Pagination from '../../components/Pagination';
import SearchBar from '../../components/SearchBar';
import Board from '../../components/Board';
import styles from './GroupSearch.module.css';

const GroupSearch = () => {
  const navigate = useNavigate();
  const { setSelectedGroup } = useAuth();
  const { openPopup } = usePopup();
  const { results, keyword, setKeyword, page, setPage, totalCount, boardLoading } = useBoard(getGroups); 

  const openPasswordInput = (groupId, groupName) => {
    openPopup({
      title: groupName, 
      content: '비밀번호를 입력하세요', 
      confirmBtnContent: '확인', 
      isInput: true, 
      onConfirm: (password) => handleVerifyPassword(groupName, groupId, password)
    });
  }

  const handleVerifyPassword = async (groupName, groupId, password) => {
    try {
      const res = await verifyGroupPassword(groupId, password);

      if(res.data.code === "RIGHT_PASSWORD") {
        openPopup({
          title: groupName, 
          content: "입사일을 선택해주세요.", 
          confirmBtnContent: '확인', 
          isDate: true, 
          onConfirm: (startDate) => handleGroupSignup(groupName, groupId, password, startDate)
        });
      }
    } catch(error) {
      if(error.response && error.response.data.code === "GROUP_NOT_FOUND") {
        openPopup({title: groupName, content: "존재하지 않는 그룹입니다."});
      }
      if(error.response && error.response.data.code === "ALREADY_JOINED") {
        openPopup({title: groupName, content: "이미 가입된 사용자입니다."});
      } 
      if(error.response && error.response.data.code === "INVALID_GROUP_PASSWORD") {
        openPopup({title: groupName, content: "비밀번호가 틀렸습니다."});
      }
      if(error.response && error.response.data.code === "SERVER_ERROR") {
        openPopup({title: "서버 에러", content: "잠시 후 다시 시도해 주세요."});
      }
    }
  }

  const handleGroupSignup = async (groupName, groupId, password, startDate) => {
    try {
      const res = await groupSignup(groupId, password, startDate);

      if(res.data.code === "SIGNUP_SUCCESS") {
        openPopup({title: groupName, content: "그룹 가입이 완료되었습니다."});
      }
    } catch(error) {
      if(error.response && error.response.data.code === "GROUP_NOT_FOUND") {
        openPopup({title: groupName, content: "존재하지 않는 그룹입니다."});
      }
      if(error.response && error.response.data.code === "ALREADY_JOINED") {
        openPopup({title: groupName, content: "이미 가입된 사용자입니다."});
      } 
      if(error.response && error.response.data.code === "INVALID_GROUP_PASSWORD") {
        openPopup({title: groupName, content: "비밀번호가 틀렸습니다."});
      }    
      if(error.response && error.response.data.code === "SERVER_ERROR") {
        openPopup({title: "서버 에러", content: "잠시 후 다시 시도해 주세요."});
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ←
        </button>
        <h1 className={styles.title}>그룹 검색</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.searchWrapper}>
          <SearchBar 
            keyword={keyword}
            setKeyword={setKeyword}
            loading={boardLoading}
          />
        </div>

        <div className={styles.boardWrapper}>
          <Board 
            results={results} 
            detailBtnContent={'가입'} 
            onDetailBtnClick={openPasswordInput}
            loading={boardLoading} 
          />
        </div>

        <div className={styles.paginationWrapper}>
          <Pagination
            page={page}
            setPage={setPage}
            total={totalCount}
            loading={boardLoading}
          />
        </div>
      </div>
    </div>
  )
}

export default GroupSearch;