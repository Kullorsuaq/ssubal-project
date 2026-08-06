import { useState } from 'react';
import ColorPicker from '../../components/ColorPicker';
import AddList from '../../components/AddList';
import usePopup from "../../hooks/usePopup";
import useAuth from '../../hooks/useAuth';
import { createGroup } from '../../api/group';
import { useNavigate } from 'react-router-dom';
import styles from './CreateGroup.module.css';

const CreateGroup = () => {
  const { user, setGroups, setSelectedGroup } = useAuth();
  const { openPopup, closePopup } = usePopup();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
     groupName: '',
     description: '',
     password: '',
     color: '#FFB3C6',
     isAlert: false
  });

  const [positionList, setPositionList] = useState([]);

  const [fields] = useState([
    {name: 'workName', label: '근무 포지션', type: 'text'}, 
    {name: 'startTime', label: '근무시작시간', type: 'time'}, 
    {name: 'endTime', label: '근무끝시간', type: 'time'},
    {name: 'wage', label: '시급', type: 'number'}
  ]); 

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); 

    const { groupName, description, password } = formData;

    if(!groupName.trim() || !description.trim() || !password.trim()) {
      setFormData(prev => ({...prev, isAlert: true}));
      return;
    } 

    setFormData(prev => ({...prev, isAlert: false}));

    const filledRows = positionList.filter(row => 
      fields.some(field => String(row[field.name]).trim() !== '')
    );

    const hasIncompleteRow = filledRows.some(row => 
      fields.some(field => {
        if (field.type === 'checkbox') return false;
        return !row[field.name] || String(row[field.name]).trim() === ''
      })
    );

    if (hasIncompleteRow) {
      openPopup({
        title: '그룹 등록 실패', 
        content: '추가하신 근무 포지션 중 입력하지 않은 항목이 있습니다. 모든 칸을 채우거나 줄을 제거해 주세요.'
      });
      return; 
    }

    try {
      setLoading(true);
      const { isAlert, ...groupData } = formData;
      const refinedPositionList = positionList
        .map(({ id, ...rest }) => rest)
        .filter(pos => pos.workName.trim() !== '');

      const res = await createGroup(user.id, groupData, refinedPositionList);

      if(res.data.code === "REGISTER_SUCCESS") {
        console.log('그룹 만들기 성공');
        const createdGroup = res.data.data;

        setGroups(prev => [...prev, createdGroup]);
        setSelectedGroup(createdGroup);

        openPopup({
          title: createdGroup.group_name, 
          content: "그룹 등록이 완료되었습니다.", 
          confirmBtnContent: '확인', 
          onConfirm: () => { closePopup(); navigate('/'); }
        });
      }
    } catch(error) {
      if(error.response && error.response.data.code === "DUPLICATE_NAME") {
        openPopup({title: "그룹 등록 실패", content: "이미 존재하는 그룹 이름입니다."});
      }
      if(error.response && error.response.data.code === "SERVER_ERROR") {
        openPopup({title: "서버 에러", content: "잠시 후 다시 시도해 주세요."});
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ←
        </button>
        <h1 className={styles.title}>그룹 만들기</h1>
      </div>

      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.formCard}>
          <div className={styles.inputGroup}>
            <label htmlFor='group-name' className={styles.label}>그룹 이름</label>
            <input
              id="group-name"
              name="groupName"
              type="text"
              placeholder="그룹 이름을 입력하세요"
              value={formData.groupName}
              disabled={loading}
              onChange={handleChange}
              className={`${styles.input} ${formData.isAlert && !formData.groupName ? styles.inputError : ''}`}
            />
            {formData.isAlert && !formData.groupName && (
              <p className={styles.errorText}>⚠️ 그룹 이름을 입력해주세요.</p>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="description" className={styles.label}>그룹 설명</label>
            <textarea
              id="description"
              name="description"
              placeholder="그룹 설명을 입력하세요"
              value={formData.description}
              disabled={loading}
              onChange={handleChange}
              rows="4"
              className={`${styles.textarea} ${formData.isAlert && !formData.description ? styles.inputError : ''}`}
            />
            {formData.isAlert && !formData.description && (
              <p className={styles.errorText}>⚠️ 그룹 설명을 입력해주세요.</p>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>그룹 비밀번호</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="그룹 비밀번호를 입력하세요"
              value={formData.password}
              disabled={loading}
              onChange={handleChange}
              className={`${styles.input} ${formData.isAlert && !formData.password ? styles.inputError : ''}`}
            />
            {formData.isAlert && !formData.password && (
              <p className={styles.errorText}>⚠️ 그룹 비밀번호를 입력해주세요.</p>
            )}
          </div>

          <div className={styles.sectionDivider} />

          <div className={styles.inputGroup}>
            <label className={styles.label}>그룹 색깔</label>
            <ColorPicker formData={formData} setFormData={setFormData} />
          </div>

          <div className={styles.sectionDivider} />

          <div className={styles.inputGroup}>
            <label className={styles.label}>그룹 근무 포지션 <span className={styles.optional}>(선택)</span></label>
            <AddList fields={fields} dataList={positionList} setDataList={setPositionList} />
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? '등록 중...' : '확인'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateGroup;