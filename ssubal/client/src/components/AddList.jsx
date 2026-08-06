import { useEffect } from 'react';
import usePopup from "../hooks/usePopup";
import useRole from '../hooks/useRole';
import styles from './AddList.module.css';

const AddList = ({fields, dataList, setDataList, mode='EDIT', selectedDate, onScheduleSelect }) => {
  const { openPopup } = usePopup(); 
  const { isOwner, isAdmin, loading } = useRole();
  const isEditable = isOwner || isAdmin || window.location.pathname === '/groups/create';

  const createNewRow = () => {
    const initialData = { id: Math.random().toString(36).substr(2, 9) };
    for(let i=0; i<fields.length; i++) {
      initialData[fields[i].name] = '';
    }
    return initialData; 
  }

  useEffect(() => {
    if(!dataList || dataList.length === 0) {
      setDataList([createNewRow()]);
    } 
  }, [dataList]);

  const handleInputChange = (id, fieldName, fieldType, e) => {
    if(mode === 'EDIT' && !isEditable) return;

    let inputValue;

    if(fieldType === 'checkbox') {
      inputValue = e.target.checked;
    } else if(fieldName === 'worker_id') {
      inputValue = e.target.value === '' ? '' : Number(e.target.value);
    } else {
      inputValue = e.target.value;
    }

    const updatedData = dataList.map((data) => {
      if(data.id === id) {
        if(fieldName === 'worker_id' || fieldName === 'participant_id') {
          const workerField = fields.find(f => f.name === 'worker_id');
          const selectedOption = workerField.options.find(opt => Number(opt.value) === inputValue);
          const newName = selectedOption ? selectedOption.label : '';
          const newParticipantId = selectedOption ? selectedOption.participant_id : '';
          return { ...data, worker_id: inputValue, participant_id: newParticipantId, worker_name: newName };
        }
        return { ...data, [fieldName]: inputValue }
      }
      return data;
    })

    setDataList(updatedData);
  }

  const handleAddRow = () => {
    const lastRow = dataList[dataList.length - 1];

    if(lastRow) {
      const emptyRow = createNewRow();
      const isRowEmpty = fields.some(field => {
        if (field.type === 'checkbox') return false;
        return String(lastRow[field.name] || '').trim() === String(emptyRow[field.name] || '').trim()
      });

      if(isRowEmpty) {
        openPopup({title: '입력 필요', content: '내용을 입력해야 다음 줄을 입력할 수 있습니다.' });
        return;
      }
    }
    setDataList([...dataList, createNewRow()]);
  }

  const handleRemoveRow = (targetId) => {
    setDataList(dataList.filter((row) => row.id !== targetId));
  }

  const handleScheduleSelect = (dataId) => {
    const data = dataList.find(item => item.id === dataId);
    if(data && data.type === "FIXED") {
      data.date = selectedDate;
    }
    onScheduleSelect(data);
  }

  if(loading) return <p>권한 확인 중...</p>

  return (
    <div className={styles.container}>
      {dataList.map((data) => (
        <div key={data.id} className={styles.rowContainer}>
          {mode === 'SELECT' && (
            <div className={styles.selectRadioWrapper}>
              <input 
                type="radio" 
                name="fieldGroup" 
                className={styles.selectRadio}
                onChange={() => handleScheduleSelect(data.id)}
              />
              <span>이 스케줄 선택</span>
            </div>
          )}
          
          {fields.map((field) => (
            <div 
              key={`${field.name}-${data.id}`} 
              className={`${styles.fieldGroup} ${field.type === 'checkbox' ? styles.checkboxGroup : ''}`}
            >
              {field.label && field.type !== 'checkbox' && (
                <label htmlFor={`${field.name}-${data.id}`}>{field.label}</label>
              )}
              
              {field.type === 'select' ? (
                <select
                  id={`${field.name}-${data.id}`}
                  onChange={e => handleInputChange(data.id, field.name, field.type, e)}
                  value={data[field.name] || ''}
                  disabled={mode === 'EDIT' && !isEditable}
                >
                  {field.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <>
                  <input
                    id={`${field.name}-${data.id}`}
                    type={field.type}
                    checked={Boolean(data[field.name])}
                    onChange={e => handleInputChange(data.id, field.name, field.type, e)}
                    disabled={mode === 'EDIT' && !isEditable}
                  />
                  {field.label && <label htmlFor={`${field.name}-${data.id}`}>{field.label}</label>}
                </>
              ) : (
                <input
                  id={`${field.name}-${data.id}`}
                  type={field.type}
                  onChange={e => handleInputChange(data.id, field.name, field.type, e)}
                  value={data[field.name] || ''}
                  disabled={mode === 'EDIT' && !isEditable}
                  placeholder={field.type === 'text' ? '직책(예: 홀, 주방) 입력' : ''}
                />
              )}
            </div>
          ))}

          {mode === "EDIT" && isEditable && (
            <button type="button" className={styles.removeBtn} onClick={() => handleRemoveRow(data.id)}>
              항목 제거
            </button>
          )}
        </div>
      ))}

      {mode === "EDIT" && isEditable && (
        <button type="button" className={styles.addBtn} onClick={handleAddRow}>
          + 근무 스케줄 추가
        </button>
      )}
    </div>
  )
}

export default AddList;