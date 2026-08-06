export const formatTime = (timeString) => {
  if(!timeString) return ''; 
  const parts = timeString.split(':');
  return `${parts[0]}:${parts[1]}`;
}

export const formatDateTime = (dateString) => {
  if(!dateString) return '';

  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const formatDate = (dateString) => {
  if(!dateString) return '';

  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}


export const formatWage = (wage) => {
  if (!wage) return '';
  
  return `${Number(wage).toLocaleString('ko-KR')}원`;
};

export const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // "2026-06-25" 형식 반환
};

//DB -> html input
//ISO 날짜 문자열("2026-06-30T15:00:00.000Z")을 HTML input[type="date"] 형식("2026-06-30")으로 변환
export const formatToInputDate = (dateString) => {
  if (!dateString) return '';

  const localDate = new Date(dateString);
  const year = localDate.getFullYear();
  //월, 일은 한 자리 수일 때 앞에 0을 붙여서 YYYY-MM-DD 포맷을 맞춤 
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`; //7월 1일인 경우 "2026-07-01"
}

//DB의 시간 문자열("15:30:00")을 HTML input[type="time"] 형식("15:30")으로 변환
export const formatToInputTime = (timeString) => {
  if (!timeString) return '';
  const parts = timeString.split(':');
  return `${parts[0]}:${parts[1]}`; //뒤에 초(:00) 떼어버림
};

export const isFutureSchedule = (dateString, timeString) => {
  if (!dateString || !timeString) return false;

  //DB에서 온 UTC 문자열을 한국 시각이 반영된 날짜 객체로 먼저 복원해야 됨!!!!!!!
  //new Date하면 한국 날짜가 됨
  //"2026-06-30T15:00:00.000Z" -> 한국 시간 기준 '2026년 7월 1일' 객체로 변환됨
  const localDate = new Date(dateString);
  
  const year = localDate.getFullYear();
  const month = localDate.getMonth(); 
  const day = localDate.getDate();

  //시작 시간 문자열에서 시, 분 추출 (예: "18:00:00" -> 18, 0)
  const [hours, minutes] = timeString.split(':').map(Number);

  //복원된 년, 월, 일 + 근무 시작 시간
  const scheduleDateTime = new Date(year, month, day, hours, minutes, 0, 0);

  const scheduleTime = scheduleDateTime.getTime();
  const currentTime = new Date().getTime();

  return scheduleTime > currentTime;
};