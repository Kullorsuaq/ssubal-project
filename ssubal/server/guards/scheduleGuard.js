const pool = require("../config/database");

const checkScheduleOwner = async (req, res, next) => {
  const { id } = req.user; 
  const participantId = req.participantId;
  let { scheduleId } = req.body;  
  let workerId = null;

  //사용자가 기존 근무 선택 안 하고 직접 입력하는 경우는 막기 
  if(!scheduleId) {
    return res.status(400).json({ code: "SCHEDULE_ID_REQUIRED", message: "근무 스케줄 선택 필수" });
  }

  try {
    const isFixedSchedule = scheduleId.includes("fixed");
    scheduleId = scheduleId.split('-')[1];

    if(isFixedSchedule) {
      const [fixedSchedulesRows] = await pool.query("select worker_id from fixed_schedules where id = ?", [scheduleId]);
      
      if(fixedSchedulesRows.length > 0) {
        workerId = fixedSchedulesRows[0].worker_id;
      }
    } else {
      const [flexibleSchedulesRows] = await pool.query("select worker_id from flexible_schedules where id = ?", [scheduleId]);

      if(flexibleSchedulesRows.length > 0) {
        workerId = flexibleSchedulesRows[0].worker_id;
      }
    }

    if(workerId === null) { 
      return res.status(404).json({ code: "SCHEDULE_NOT_FOUND", message: "존재하지 않는 근무 스케줄" });
    }

    if(workerId !== participantId) {
      console.log(workerId, participantId);
      return res.status(403).json({ code: "NOT_SCHEDULE_OWNER", message: "자신의 근무 스케줄만 글로 올릴 수 있음"});
    }

    next();
  } catch(error) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

module.exports = {
  checkScheduleOwner
}