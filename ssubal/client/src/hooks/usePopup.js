import { PopupContext } from "../contexts/PopupContext";
import { useContext } from "react";

function usePopup() {
  const context = useContext(PopupContext);

  if(!context) {
    throw new Error("usePopup은 PopupProvider 안에서만 사용 가능");
  }

  return context; 
}

export default usePopup; 