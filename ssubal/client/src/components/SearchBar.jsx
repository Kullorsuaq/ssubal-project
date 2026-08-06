import React, { useState } from 'react';
import styles from './SearchBar.module.css';

function SearchBar({ keyword, setKeyword, loading, placeholder = "검색" }) {
  const [typedKeyword, setTypedKeyword] = useState(keyword || '');

  const handleChange = (e) => {
    const value = e.target.value;
    setTypedKeyword(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setKeyword(typedKeyword);
    }
  };

  const handleClear = () => {
    setTypedKeyword('');
    setKeyword('');
  };

  return (
    <div className={styles.searchContainer}>
      <span className={styles.searchIcon}>🔍</span>
      <input 
        type="text"
        value={typedKeyword}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={loading}
        placeholder={placeholder}
        className={styles.searchInput}
      />
      {typedKeyword && (
        <button type="button" onClick={handleClear} className={styles.clearButton}>
          ✕
        </button>
      )}
    </div>
  );
}

export default SearchBar;