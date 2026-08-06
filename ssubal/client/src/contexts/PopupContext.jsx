import { createContext, useState, useContext } from 'react';

export const PopupContext = createContext();

const initialPopupState = {
  isOpen: false,
  title: '',
  content: '',
  confirmBtnContent: '',
  isInput: false,
  isDate: false,
  onConfirm: null
};

export const PopupProvider = ({ children }) => {
  const [popupConfig, setPopupConfig] = useState(initialPopupState);

  const openPopup = (config) => {
    setPopupConfig({...initialPopupState, ...config, isOpen: true});
  };

  const closePopup = () => {
    setPopupConfig(initialPopupState);
  };

  return (
    <PopupContext.Provider value={{popupConfig, openPopup, closePopup}}>
      {children}
    </PopupContext.Provider>
  )
}