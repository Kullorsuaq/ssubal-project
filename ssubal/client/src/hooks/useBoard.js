import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import usePopup from '../hooks/usePopup';
import useAuth from './useAuth';

//함수 외부에 빈 객체 선언하면 주소가 고정됨(useMemo 사용 안해도 됨)
const EMPTY_OBJECT = {};

const useBoard = (getList, extraParams=EMPTY_OBJECT) => { //extraParams를 객체 형태로 한꺼번에 줘야 함
  const [results, setResults] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [boardLoading, setBoardLoading] = useState(false);
  const { openPopup } = usePopup();
  const { selectedGroup, isLogin } = useAuth();
  const { groupId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatas = async () => {

      try {
        setBoardLoading(true);
        const res = await getList({ no: page, keyword, ...extraParams });
        setResults(res.data.data);
        setTotalCount(res.data.total);
      } catch(error) {

        //특정 그룹의 게시글 불러오는 경우
        if (error.response && error.response.data.code === "NOT_GROUP_MEMBER") {
          openPopup({
            title: "권한 없음",
            content: "해당 그룹의 멤버가 아니므로 글을 볼 수 없습니다."
          });
          if(selectedGroup && window.location.pathname !== '/') { //홈일 때는 이동X
            navigate(`/groups/${selectedGroup.group_id}`);
          } else {
            navigate('/');
          }
        }

        if(error.response && error.response.data.code === "SERVER_ERROR") {
          openPopup({ title: "서버 에러", content: "목록을 불러오지 못했습니다." });
        }
      } finally {
        setBoardLoading(false);
      }
    };
    
    fetchDatas();
  }, [groupId, page, keyword, getList, extraParams]); //의존성 배열에 나머지 변수를 넣으면 단순한 값들만 들어가므로 무한 루프X

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  return {
    results,
    keyword,
    setKeyword,
    page,
    setPage,
    totalCount,
    boardLoading
  }
}

export default useBoard;