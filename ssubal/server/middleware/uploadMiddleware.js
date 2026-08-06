const multer = require('multer');
const path = require('path');

//서버에 올라온 파일을 메모리가 아니라 하드디스크에 파일 형태로 직접 저장
const storage = multer.diskStorage({
  //cb는 처리가 끝났음을 알리는 콜백 함수
  destination: (req, file, cb) => { //파일을 저장할 폴더
    cb(null, 'uploads/');
  }, 
  filename: (req, file, cb) => { //파일 이름
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
})

//이미지 파일만 필터링
const fileFilter = (req, file, cb) => {
  if(file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능'), false);
  }
}

//저장 위치와 필터링을 묶어 미들웨어 객체인 upload 생성
const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;