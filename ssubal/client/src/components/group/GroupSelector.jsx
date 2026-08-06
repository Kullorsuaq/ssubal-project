import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import styles from './GroupSelector.module.css';

function GroupSelector({ groups }) {  
  const { selectedGroup, setSelectedGroup } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (group) => {
    setSelectedGroup(group);
    setIsOpen(false);
    navigate(`/groups/${group.group_id}`);
  };

  const currentGroup = selectedGroup || (groups && groups[0]);

  return (
    <div className={styles.accordionContainer}>
      <button 
        type="button"
        className={`${styles.headerButton} ${isOpen ? styles.open : ''}`}
        onClick={toggleAccordion}
        style={{ '--group-color': currentGroup?.theme_color }}
      >
        <div className={styles.selectedContent}>
          <span className={styles.colorDot} />
          <span className={styles.groupName}>
            {currentGroup ? currentGroup.group_name : '그룹 선택'}
          </span>
        </div>
        <span className={`${styles.arrowIcon} ${isOpen ? styles.rotated : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <ul className={styles.groupList}>
          {groups && groups.length > 0 ? (
            groups.map((group) => {
              const isSelected = currentGroup.group_id === group.group_id;

              return (
                <li key={group.group_id} className={styles.groupItem}>
                  <Link 
                    to={`/groups/${group.group_id}/`} 
                    onClick={() => handleSelect(group)}
                    className={`${styles.groupLink} ${isSelected ? styles.selected : ''}`}
                    style={{ '--group-color': group.theme_color }}
                  >
                    <span className={styles.colorDot} />
                    <span className={styles.groupName}>{group.group_name}</span>
                  </Link>
                </li>
              );
            })
          ) : (
            <li className={styles.emptyText}>참여 중인 그룹이 없습니다</li>
          )}

          <div className={styles.divider} />

          <li className={styles.groupItem}>
            <button 
              type="button"
              className={styles.actionLink}
              onClick={() => {
                setIsOpen(false);
                navigate('/groups/search');
              }}
            >
              <span className={styles.groupName}>그룹 추가</span>
            </button>
          </li>

          <li className={styles.groupItem}>
            <button 
              type="button"
              className={styles.actionLink}
              onClick={() => {
                setIsOpen(false);
                navigate('/groups/create');
              }}
            >
              <span className={styles.groupName}>그룹 직접 만들기</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

export default GroupSelector;