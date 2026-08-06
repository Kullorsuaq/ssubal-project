import styles from './Login.module.css';

function Login() {
  const kakao = () => {
    window.open(
      `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${import.meta.env.VITE_KAKAO_CLIENT_ID}&redirect_uri=${import.meta.env.VITE_REDIRECT_URI}`,
      "_self"
    );
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.brandHero}>
        <div className={styles.logoIcon}>🧩</div>
        <h1 className={styles.appName}>SSUBAL</h1>
        <p className={styles.appTagline}>
          갑자기 사정이 생겼을 땐?<br/>
          우리 매장 알바생끼리 대타 교환하기<br/>
          눈치 보지 말고 섭알에서 쉽게 구하세요!
        </p>
      </div>

      <div className={styles.loginCard}>
        <div className={styles.brandArea}>
          <span className={styles.badge}>간편 시작</span>
          <h2 className={styles.title}>
            3초 만에 로그인하고<br />
            대타 구하기
          </h2>
        </div>

        <button 
          type="button" 
          className={styles.kakaoButton}
          onClick={kakao}
        >
          <svg 
            className={styles.kakaoIcon} 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              fillRule="evenodd" 
              clipRule="evenodd" 
              d="M12 3C6.477 3 2 6.48 2 10.782C2 13.565 3.805 15.986 6.534 17.32L5.59 20.785C5.462 21.258 5.992 21.628 6.398 21.358L10.518 18.623C11.003 18.718 11.496 18.765 12 18.765C17.523 18.765 22 15.285 22 10.782C22 6.48 17.523 3 12 3Z" 
              fill="#191919"
            />
          </svg>
          <span className={styles.buttonText}>카카오 로그인</span>
        </button>
      </div>
    </div>
  );
}

export default Login;