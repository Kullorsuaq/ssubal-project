import { AuthContext } from "../contexts/AuthContext";
import { useContext } from "react";

function useAuth() {
  const context = useContext(AuthContext);

  if(!context) {
    throw new Error("useAuth는 AuthProvider 안에서만 사용 가능");
  }

  return context; 
}

export default useAuth; 