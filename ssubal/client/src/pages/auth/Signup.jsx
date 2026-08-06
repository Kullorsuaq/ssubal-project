import { signup, updatePushToken } from "../../api/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import styles from "./Signup.module.css";

function Signup() {
  const [alert, setAlert] = useState(false);
  const [formData, setFormData] = useState({
    name: ""
  });

  const { setIsLogin, setUser } = useAuth();
  const navigate = useNavigate();

  const isNameEmpty = formData.name.trim().length === 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isNameEmpty) {
      setAlert(true);
      return;
    }

    signup(formData)
      .then((result) => {
        console.log(result);
        if (result.data.code === "SIGNUP_SUCCESS") {
          setUser(result.data.data);
          setIsLogin(true);

          const handleNewUserToken = (event) => {
            //신규 가입자 폰 토큰 수신
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'RESPONSE_PUSH_TOKEN') {

                updatePushToken({ token: data.token })
                  .then((res) => console.log("신규 유저 토큰 저장 완료:", res.data.message))
                  .catch((err) => console.error("신규 유저 토큰 저장 실패:", err))
                  .finally(() => {
                    window.removeEventListener('message', handleNewUserToken);
                    document.removeEventListener('message', handleNewUserToken);
                    navigate("/");
                  });
              }
            } catch (error) {}
          };

          window.addEventListener('message', handleNewUserToken);
          document.addEventListener('message', handleNewUserToken);

          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REQUEST_PUSH_TOKEN' }));
          } else {
            navigate("/");
          }
        }
      })
      .catch((error) => {
        if (error.response && error.response.data && error.response.data.code === "EXPIRED_SESSION") {
          navigate('/');
        }
      })
  }

  const handleChange = e => {
    setFormData({...formData, [e.target.name]: e.target.value});
    if (alert && e.target.value.trim().length > 0) {
      setAlert(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>환영합니다 👋</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.label}>이름을 입력해주세요</label>
            <input 
              type="text" 
              name="name" 
              id="name" 
              className={styles.input}
              value={formData.name} 
              onChange={handleChange}
              placeholder="예: 김알바"
            />
          </div>

          {alert && (
            <p className={styles.errorText}>이름을 반드시 입력해야 합니다.</p>
          )}

          <button type="submit" className={styles.submitBtn}>확인</button>
        </form>
      </div>
    </div>
  )
}

export default Signup;