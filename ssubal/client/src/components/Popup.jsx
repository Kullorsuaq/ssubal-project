import { useState, useEffect } from 'react';
import usePopup from '../hooks/usePopup';
import styles from './Popup.module.css';

const Popup = () => {
  const [inputData, setInputData] = useState({
    input: '',
    isAlert: false
  });

  const { popupConfig, closePopup } = usePopup();

  useEffect(() => {
    setInputData({ input: '', isAlert: false })
  }, [popupConfig.isOpen]);

  const handleConfirm = () => {
    if(popupConfig.onConfirm) {
      if((popupConfig.isInput || popupConfig.isDate) && !(inputData.input.trim())) {
        setInputData(prev => ({ ...prev, isAlert: true }));
        return; 
      } else { //입력 데이터 있을 때
        popupConfig.onConfirm(inputData.input);
      }
    } else {
      closePopup();
    }
  }

  return (
    <>
      {popupConfig.isOpen && (
        <div className={styles.overlay}>
          <div className={styles.popupBox}>
            <h1 className={styles.title}>{popupConfig.title}</h1>
            <div className={styles.content}>{popupConfig.content}</div>
            {popupConfig.isInput && (<div className={styles.inputArea}>
              {inputData.isAlert && <p>값이 입력되지 않았습니다.</p>}
              <input 
                className={styles.input}
                type="text"
                value={inputData.input}
                onChange={(e) => setInputData(prev => ({...prev, input: e.target.value, isAlert: false}))}
              />
            </div>
            )}
            {popupConfig.isDate && (<div className={styles.inputArea}>
              {inputData.isAlert && <p>날짜가 선택되지 않았습니다.</p>}
              <input
                className={styles.input}
                type="date"
                value={inputData.input}
                onChange={(e) => setInputData(prev => ({...prev, input: e.target.value, isAlert: false}))}
              />
            </div>
            )}
            <div className={styles.btnArea}>
              {popupConfig.confirmBtnContent && (<button
                onClick={handleConfirm} className={styles.confirmBtn}
              >{popupConfig.confirmBtnContent}</button>)}
              <button onClick={closePopup} id={styles.cancleBtn}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Popup;