const mysql = require("mysql2/promise");
require("dotenv").config();

//커넥션 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  waitForConnections: true,
  queueLimit: 0
});

//테스트용(서버 켜질 때 DB 연결 잘 되나 찔러보는 로직)
pool.getConnection()
  .then(connection => {
    console.log('커넥션 풀 연결 성공');
    connection.release;
  })
  .catch(err => {
    console.log('DB 연결 실패:', err);
  })

module.exports = pool;