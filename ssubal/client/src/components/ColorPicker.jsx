import { useState } from 'react';

const ColorPicker = ({ formData, setFormData }) => {  
  const handleColor = (selectedColor) => {
    setFormData(prev => ({...prev, color: selectedColor}));
  }

  const themeColors = ['#FFB3C6', '#64DFDF', '#97E3A0', '#FFB7A1', '#D6C7FF'];

  return (
    <>
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
      {themeColors.map((hex) => (
        <div
          key={hex}
          onClick={() => handleColor(hex)} 
          style={{
            backgroundColor: hex,
            width: '45px',
            height: '45px',
            borderRadius: '50%', 
            cursor: 'pointer',
            border: hex === formData.color ? '2px solid black' : '2px solid transparent',
            boxSizing: 'border-box',
            transition: 'border 0.2s ease'        
          }}
        />
      ))}
      </div>
    </>
  )
}

export default ColorPicker;