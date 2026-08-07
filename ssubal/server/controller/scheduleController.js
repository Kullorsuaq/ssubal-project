const axios = require("axios"); 
const pool = require("../config/database");
const { sendPushNotification } = require("../utils");

const acceptApplicant = async (req, res) => {
  const { id } = req.user;
  const { applicantId, groupId } = req.params;
  const participantId = req.participantId;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [applicantRows] = await connection.query(
      `select
        sa.post_id,
        sa.applicant_id,
        sp.writer_id,
        fs.position,
        sp.date,
        sp.start_time,
        sp.end_time
      from substitute_applicants sa
      join substitute_posts sp on sa.post_id = sp.id
      left join fixed_schedules fs on sp.writer_id = fs.worker_id
      where sa.id = ?`,
      [applicantId]
    );

    if(applicantRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ code: "APPLICANT_NOT_FOUND", message: "존재하지 않는 지원서"});
    }

    const { post_id: postId, applicant_id: workerId, writer_id: writerId, date, start_time: startTime, end_time: endTime, position } = applicantRows[0];

    const subStart = String(startTime).substring(0, 5);
    const subEnd = String(endTime).substring(0, 5);
    const dayOfWeek = new Date(date).getDay(); //0~6

    //신규 근무자의 기존 스케줄과 대타 시간 중복 검증
    //신규 근무자의 해당 날짜 유동 스케줄 조회(결석 처리된 null 건은 제외)
    const [targetWorkerFlex] = await connection.query(`
      select start_time, end_time from flexible_schedules
      where worker_id = ?
        and date_format(\`date\`, '%Y-%m-%d') = date_format(?, '%Y-%m-%d')
        and start_time is not null
    `, [workerId, date]);

    const hasFlexOverlap = targetWorkerFlex.some(flex => {
      const fStart = String(flex.start_time).substring(0, 5);
      const fEnd = String(flex.end_time).substring(0, 5);
      return (subStart < fEnd) && (subEnd > fStart);
    });

    if(hasFlexOverlap) {
      await connection.rollback();
      return res.status(400).json({ code: "SCHEDULE_OVERLAP_ERROR", message: "근무 시간 중복" });
    }

    //신규 근무자의 해당 요일 고정 스케줄 조회
    const [targetWorkerFixed] = await connection.query(`
      select start_time, end_time from fixed_schedules
      where worker_id = ? and \`day\` = ?
    `, [workerId, dayOfWeek]);

    if(targetWorkerFixed.length > 0) {
      const [canceledCheck] = await connection.query(`
        select id from flexible_schedules
        where worker_id = ?
          and date_format(\`date\`, '%Y-%m-%d') = date_format(?, '%Y-%m-%d')
          and start_time is null
      `, [workerId, date]);

      const isCanceled = canceledCheck.length > 0;

      if(!isCanceled) {
        const hasFixedOverlap = targetWorkerFixed.some(fixed => {
          const fxStart = String(fixed.start_time).substring(0, 5);
          const fxEnd = String(fixed.end_time).substring(0, 5);
          return (subStart < fxEnd) && (subEnd > fxStart);
        });

        if(hasFixedOverlap) {
          await connection.rollback();
          return res.status(400).json({ code: "SCHEDULE_OVERLAP_ERROR", message: "근무 시간 중복" });
        }
      }      
    }

    await connection.query(
      `update substitute_applicants
      set status = case
        when id = ? then 'ACCEPTED'
        else 'REJECTED'
      end
      where post_id = ?`,
      [applicantId, postId]
    );

    await connection.query(
      `update substitute_posts_data set status = 'CLOSED' where id = ?`,
      [postId]
    );

    //기존 유저 스케줄 불러오기
    const [flexibleSchedulesRows] = await connection.query(
      `select * from flexible_schedules
      where worker_id = ? and DATE_FORMAT(\`date\`, '%Y-%m-%d') = DATE_FORMAT(?, '%Y-%m-%d')`,
      [writerId, date]
    );

    const [fixedSchedulesRows] = await connection.query(
      `select * from fixed_schedules
      where worker_id = ? and day = ?`,
      [writerId, dayOfWeek]
    );

    if(flexibleSchedulesRows.length > 0) {     
      const targetFlexSchedule = flexibleSchedulesRows.find(flex => {
        const fStart = String(flex.start_time).substring(0, 5);
        const fEnd = String(flex.end_time).substring(0, 5);
        return (subStart < fEnd) && (subEnd > fStart);
      });
      
      const originFlexId = targetFlexSchedule.id;
      await connection.query(
        `delete from flexible_schedules where id = ?`, [originFlexId]
      );
      console.log('여기 실행!', targetFlexSchedule);

      if(targetFlexSchedule) {      
        const originStart = String(targetFlexSchedule.start_time).substring(0,5);

        if(originStart !== subStart) {
          await connection.query(
            `insert into flexible_schedules (worker_id, \`date\`, position, start_time, end_time, wage) 
            select ?, \`date\`, ?, ?, ?, wage
            from substitute_posts_data 
            where id = ?`,
            [writerId, position, originStart, subStart, postId]
          );
        }

        const originEnd = String(targetFlexSchedule.end_time).substring(0,5);

        console.log(originEnd, subEnd);

        if(originEnd !== subEnd) {
          console.log('여기 실행');
          const result = await connection.query(
            `insert into flexible_schedules (worker_id, \`date\`, position, start_time, end_time, wage)
            select ?, \`date\`, ?, ?, ?, wage
            from substitute_posts_data
            where id = ?`,
            [writerId, position, subEnd, originEnd, postId]
          )
          console.log(result);
        }

        await connection.query(
          `insert into flexible_schedules (worker_id, \`date\`, position, start_time, end_time, wage)
          select ?, \`date\`, ?, start_time, end_time, wage
          from substitute_posts_data 
          where id = ?`,
          [workerId, position, postId]
        );
      }
    }  

    if(fixedSchedulesRows.length > 0) {
      const targetFixedSchedule = fixedSchedulesRows.find(fixed => {
        const fStart = String(fixed.start_time).substring(0, 5);
        const fEnd = String(fixed.end_time).substring(0, 5);
        return (subStart < fEnd) && (subEnd > fStart);
      });

      if(targetFixedSchedule) {
        await connection.query(
          `insert into flexible_schedules (worker_id, \`date\`, position, start_time, end_time, wage) values (?, ?, ?, null, null, 0)`, [writerId, date, position]
        );
      
        const originStart = String(targetFixedSchedule.start_time).substring(0,5);

        if(originStart !== subStart) {
          await connection.query(
            `insert into flexible_schedules (worker_id, \`date\`, position, start_time, end_time, wage) 
            select ?, \`date\`, ?, ?, ?, wage
            from substitute_posts_data 
            where id = ?`,
            [writerId, position, originStart, subStart, postId]
          );
        }

        const originEnd = String(targetFixedSchedule.end_time).substring(0,5);

        if(originEnd !== subEnd) {
          await connection.query(
            `insert into flexible_schedules (worker_id, \`date\`, position, start_time, end_time, wage)
            select ?, \`date\`, ?, ?, ?, wage
            from substitute_posts_data
            where id = ?`,
            [writerId, position, subEnd, originEnd, postId]
          )
        }

        await connection.query(
          `insert into flexible_schedules (worker_id, \`date\`, position, start_time, end_time, wage)
          select ?, \`date\`, ?, start_time, end_time, wage
          from substitute_posts_data 
          where id = ?`,
          [workerId, position, postId]
        );
      }
    }

    const [workerRows] = await connection.query(`
      select u.id, u.push_token from users u join group_participants gp on u.id = gp.user_id where gp.id = ?
    `, [workerId]);

    const [postRows] = await connection.query(`select title from substitute_posts_data where id = ?`,
      [postId]
    );

    const receiverId = workerRows[0].id;
    const metadata = { postId: postId, postTitle: postRows[0].title };

    const [notiResult] = await connection.query(`
      insert into notifications (group_id, sender_id, receiver_id, type, metadata) values (?, ?, ?, ?, ?)
    `, [groupId, id, receiverId, 'POST_SUB_ACCEPT', JSON.stringify(metadata)]); //metadata(객체) -> 문자열화

    const notiId = notiResult.insertId;

    await connection.commit();

    const worker = workerRows[0];

    if(worker && worker.push_token) {
      const pushTitle = `대타 지원 수락되었습니다. - ${postRows[0].title}`;
      const pushBody = `지원하신 대타 근무가 확정되었습니다.`;
      const pushData = { postId: postId, groupId: groupId, notiId: notiId, type: 'POST_SUB_ACCEPT' };

      const pushTokens = [worker.push_token];

      sendPushNotification(pushTokens, pushTitle, pushBody, pushData);
    }

    res.status(200).json({ code: "APPLICANT_ACCEPTED_SUCCESS", message: "지원 수락 성공", applicantId: workerId }); 

  } catch(error) {
    await connection.rollback();
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  } finally {
    connection.release();
  }
}
 
const applySchedule = async (req, res) => {
  const { id } = req.user;
  const { postId } = req.body;
  const { groupId } = req.params;
  const applicantId = req.participantId;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [postRows] = await connection.query(
      `select p.*, u.id, u.push_token
      from substitute_posts_data p
      join group_participants gp on p.writer_id = gp.id
      join users u on gp.user_id = u.id
      where p.id = ?`, 
      [postId]
    );

    if(postRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ code: "POST_NOT_FOUND", message: "존재하지 않거나 삭제된 게시글" });
    }

    if(postRows[0].status === "CLOSED") {
      await connection.rollback();
      return res.status(400).json({ code: "POST_ALREADY_CLOSED", message: "이미 지원 마감된 게시글" });
    }

    if(postRows[0].writer_id === applicantId) {
      await connection.rollback();
      return res.status(400).json({ code: "CANNOT_APPLY_OWN_POST", message: "본인이 작성한 게시글에 지원할 수 없음" });
    }

    const [existingApplicant] = await connection.query(
      `select id from substitute_applicants where post_id = ? and applicant_id = ?`,
      [postId, applicantId]
    );

    if(existingApplicant.length > 0) {
      await connection.rollback();
      return res.status(400).json({ code: "ALREADY_APPLIED", message: "이미 지원한 게시글" });
    }

    await connection.query(
      `insert into substitute_applicants (post_id, applicant_id, status) values (?, ?, 'PENDING')`,
      [postId, applicantId]
    );

    const applicantsQuery = `
      select 
        sa.id as id,
        sa.status as status,
        u.id as applicant_id, 
        u.name as applicant_name, 
        u.img_url as applicant_profile_img
      from substitute_applicants sa
      join group_participants gp on sa.applicant_id = gp.id
      join users u on gp.user_id = u.id
      where sa.applicant_id = ? and sa.post_id = ?
    `;
    
    const [applicantRows] = await connection.query(applicantsQuery, [applicantId, postId]);

    const postOwner = postRows[0];

    const receiverId = postOwner.id;
    const metadata = { postId: postId, postTitle: postRows[0].title, applicantName: applicantRows[0].applicant_name };

    const [notiResult] = await connection.query(`
      insert into notifications (group_id, sender_id, receiver_id, type, metadata) values (?, ?, ?, ?, ?)
    `, [groupId, id, receiverId, 'POST_SUB_APPLY', JSON.stringify(metadata)]); //metadata(객체) -> 문자열화

    const notiId = notiResult.insertId;

    await connection.commit();

    if(postOwner && postOwner.push_token) {
      const pushTitle = `새로운 대타 지원자가 있습니다. - ${postRows[0].title}`;
      const pushBody = `${applicantRows[0].applicant_name}님이 근무에 지원하셨습니다.`;
      const pushData = { postId: postId, groupId: groupId, notiId: notiId, type: 'POST_SUB_APPLY' };

      const pushTokens = [postOwner.push_token];

      sendPushNotification(pushTokens, pushTitle, pushBody, pushData);
    }

    return res.status(201).json({ code: "APPLY_SUCCESS", message: "대타 지원 완료", isApplied: true, applicants: applicantRows[0] });
  } catch(error) {
    await connection.rollback();
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  } finally {
    connection.release();
  }
}

const getMonthlySchedules = async (req, res) => {
  const { groupId } = req.params;
  const { year, month, type, date } = req.query;
  const participantId = req.participantId; 
  try {

    const fixedSchedulesQuery = `
      select 
        fs.*,
        fs.worker_id as participant_id,
        u.id as worker_id,
        u.name as worker_name,
        u.img_url as worker_profile_img
      from fixed_schedules fs
      join group_participants gp on fs.worker_id = gp.id
      join users u on gp.user_id = u.id
      where gp.group_id = ?
    `;

    const [fixedSchedulesRows] = await pool.query(fixedSchedulesQuery, [groupId]);

    const flexibleSchedulesQuery = `
      select
        fs.*,
        fs.worker_id as participant_id,
        u.id as worker_id,
        u.name as worker_name,
        u.img_url as worker_profile_img
      from flexible_schedules fs
      join group_participants gp on fs.worker_id = gp.id
      join users u on gp.user_id = u.id
      where gp.group_id = ? and year(fs.\`date\`) = ? and month(fs.\`date\`) = ?
    `;

    const [flexibleSchedulesRows] = await pool.query(flexibleSchedulesQuery, [groupId, year, month]);

    //유동 스케줄을 날짜별 객체로 묶기
    const flexibleMap = {};
    flexibleSchedulesRows.forEach(flex => {
      const dateStr = typeof flex.date === 'string'
      ? flex.date.split(' ')[0]
      : flex.date.toLocaleDateString('sv-SE'); //한국 시간대로 바꿈

      if(!flexibleMap[dateStr]) {
        flexibleMap[dateStr] = [];
      }
      flexibleMap[dateStr].push(flex); //flexibleMap['해당 월의 특정 날짜'] = [{flexibleSchedulesRow}, {flexibleSchedulesRow}]
    })

    //달력에 넣을 일자별 스케줄
    const calendarSchedules = {};
    const targetYear = parseInt(year);
    const targetMonth = parseInt(month);
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate(); //다음 달의 0 번째 날(=해당 달의 마지막 날)의 마지막 날짜 -> 해당 월의 총 일수

    //해당 월의 1일부터 말일까지 루프
    for(let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`; //2001-09-16
      const dateObj = new Date(targetYear, targetMonth - 1, day);
      const dayOfWeek = dateObj.getDay(); 

      calendarSchedules[dateStr] = []; //모든 날의 날짜별 배열을 담은 객체를 만듦

      //특정 날의 유동 스케줄들 먼저 캘린더에 담기(null인 근무 취소 행은 담지 않음)
      const flexibleSchedules = flexibleMap[dateStr] || [];
      flexibleSchedules.forEach(flex => {
        if(flex.start_time !== null && flex.end_time !== null) {
          calendarSchedules[dateStr].push({
            ...flex,
            id: `flex-${flex.id}`,
            type: 'FLEXIBLE'
          })
        }
      })

      //고정 근무 처리(유동 테이블에 null로 박힌 날이 있는지 검사)
      fixedSchedulesRows.forEach(fixed => {
        if(fixed.day === dayOfWeek) {
          const isCanceled = flexibleSchedules.some(
            flex => flex.worker_id === fixed.worker_id && flex.start_time === null
          );

          if(!isCanceled) {
            calendarSchedules[dateStr].push({
              ...fixed,
              id: `fixed-${fixed.id}`,
              type: 'FIXED'
            });
          }
        }
      })
    }
    
    res.status(200).json({
      code: "SCHEDULE_FETCH_SUCCESS",
      message: "스케줄 불러오기 성공",
      schedules: calendarSchedules
    });

  } catch(error) {
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  }
}

const updateSchedule = async (req, res) => {
  const { id } = req.user;
  const { groupId } = req.params;
  const { date, scheduleData } = req.body;
  const participantId = req.participantId;
  const dayOfWeek = new Date(date).getDay(); //0~6
  console.log(date, scheduleData);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const lockFixedQuery = `
      select fs.* from fixed_schedules fs
      join group_participants gp on fs.worker_id = gp.id
      where gp.group_id = ? and fs.day = ? for update; 
    `;

    const lockFlexibleQuery = `
      select fl.* from flexible_schedules fl
      join group_participants gp on fl.worker_id = gp.id
      where gp.group_id = ? and fl.\`date\` = ? for update;
    `;

    const [fixedSchedules] = await connection.query(lockFixedQuery, [groupId, dayOfWeek]);
    await connection.query(lockFlexibleQuery, [groupId, date]);

    //들어온 요청 값끼리(같은 근무자) 시간 중복 검증
    for(let i = 0; i < scheduleData.length; i++) {
      for(let j = i + 1; j < scheduleData.length; j++) {
        const a = scheduleData[i];
        const b = scheduleData[j];

        if(a.participant_id === b.participant_id) {
          const startA = String(a.start_time).substring(0, 5);
          const endA = String(a.end_time).substring(0, 5);
          const startB = String(b.start_time).substring(0, 5);
          const endB = String(b.end_time).substring(0, 5);
          const isOverlapped = (startA < endB) && (endA > startB);
          console.log(isOverlapped);

          if(isOverlapped) {
            await connection.rollback();
            return res.status(400).json({ code: "SCHEDULE_OVERLAP_ERROR", message: "근무 시간 중복" });
          }
        }
      }
    }

    //기존 DB 고정 스케줄과 새로 요청받은 유동 스케줄 간의 중복 체크
    const flexibleReqs = scheduleData.filter(s => s.schedule_type === 'FLEXIBLE');
    
    for(const flex of flexibleReqs) {
      const startFlex = String(flex.start_time).substring(0, 5);
      const endFlex = String(flex.end_time).substring(0, 5);

      const isOverlapWithExistingFixed = fixedSchedules.some(fixed => {
        if(fixed.worker_id !== flex.participant_id) return false;

        const startFixed = String(fixed.start_time).substring(0, 5);
        const endFixed = String(fixed.end_time).substring(0, 5);

        return (startFlex < endFixed) && (endFlex > startFixed);
      });

      if(isOverlapWithExistingFixed) {
        await connection.rollback();
        return res.status(400).json({ code: "FIXED_FLEXIBLE_OVERLAP_ERROR", message: "근무 시간 중복" });
      }
    }

    //고정 근무 신규 등록시, 미래의 대타 스케줄과 겹치는지 조사
    const fixedSchedulesInRequest = scheduleData.filter(s => s.schedule_type === 'FIXED');

    for(const fixed of fixedSchedulesInRequest) {
      const workerId = fixed.participant_id;

      const checkFutureFlexQuery = `
        select fl.* from flexible_schedules fl
        join group_participants gp on fl.worker_id = gp.id
        where gp.group_id = ?
          and fl.worker_id = ?
          and dayofweek(fl.\`date\`) = ? 
          and fl.start_time < ?
          and fl.end_time > ?
      `;

      const [conflictingFlexibleSchedule] = await connection.query(
        checkFutureFlexQuery, [groupId, workerId, dayOfWeek + 1, fixed.end_time, fixed.start_time]
      );

      if(conflictingFlexibleSchedule.length > 0) {
        await connection.rollback();
        const conflictDate = conflictingFlexibleSchedule[0].date.toLocaleDateString('sv-SE');
        return res.status(400).json({ code: "FUTURE_SCHEDULE_OVERLAP_ERROR", message: "해당 시간에 이미 대타 근무 등록됨" });
      }
    }

    //그날 유동 스케줄만 리셋(고정은 X)
    const deleteFlexQuery = `
      delete fl from flexible_schedules fl
      join group_participants gp on fl.worker_id = gp.id
      where gp.group_id = ? and fl.\`date\` = ?;
    `;

    await connection.query(deleteFlexQuery, [groupId, date]);

    const fixedInserts = [];
    const flexibleInserts = [];

    //원래 고정이었는데 결석한 거 처리
    fixedSchedules.forEach(fixed => {
      const stillExists = scheduleData.find(schedule => (schedule.participant_id === fixed.worker_id && schedule.schedule_type === 'FIXED'));

      if(!stillExists) {
        flexibleInserts.push([
          fixed.worker_id,
          date,
          fixed.position,
          null,
          null,
          0
        ]);
      }
    });

    scheduleData.forEach(schedule => {
      const workerId = schedule.participant_id;

      if(schedule.schedule_type === 'FLEXIBLE') {
        flexibleInserts.push([
          workerId,
          date,
          schedule.position,
          schedule.start_time,
          schedule.end_time,
          Number(schedule.wage)
        ]);
      } else if(schedule.schedule_type === 'FIXED') {
        const startReq = String(schedule.start_time).substring(0, 5);
        const endReq = String(schedule.end_time).substring(0, 5);

        const isAlreadyInDB = fixedSchedules.some(fixed => 
          fixed.worker_id === workerId &&
          String(fixed.start_time).substring(0, 5) === startReq &&
          String(fixed.end_time).substring(0, 5) === endReq
        );

        if(isAlreadyInDB) {
          return;
        }

        //DB에 없는 새로운 시간대 고정 근무만 담기
        fixedInserts.push([
          workerId,
          dayOfWeek,
          schedule.position,
          schedule.start_time,
          schedule.end_time,
          Number(schedule.wage)
        ])
      }
    });

    if(flexibleInserts.length > 0) {
      const insertFlexibleQuery = `
        insert into flexible_schedules (worker_id, \`date\`, position, start_time, end_time, wage)
        values ?;
      `;
      await connection.query(insertFlexibleQuery, [flexibleInserts]);
    }

    if(fixedInserts.length > 0) {
      const insertFixedQuery = `
        insert into fixed_schedules (worker_id, \`day\`, position, start_time, end_time, wage)
        values ?;
      `;
      await connection.query(insertFixedQuery, [fixedInserts]);
    }

    const [memberRows] = await connection.query(`
      select u.id, u.push_token, gp.id as participant_id
      from users u 
      join group_participants gp on gp.user_id = u.id
      where gp.group_id = ?     
    `, [groupId]);

    const targetMembers = memberRows.filter(member => member.participant_id !== participantId);

    if(targetMembers.length > 0) {
      const metadata = JSON.stringify({ groupId });
      const insertValues = targetMembers.map(member => [
        groupId,
        id,
        member.id,
        'SCHEDULE_UPDATE',
        metadata
      ]);

      const [insertResult] = await connection.query(`
        insert into notifications (group_id, sender_id, receiver_id, type, metadata) values ?
      `, [insertValues]);

      const firstNotiId = insertResult.insertId;

      const pushTitle = `스케줄이 업데이트되었습니다.`;
      const pushBody = `스케줄 정보가 업데이트되었습니다. 앱에서 확인해 주세요.`;

      targetMembers.forEach((member, idx) => {
        if(member.push_token) {
          const userNotiId = firstNotiId + idx;

          const pushData = {
            groupId: groupId,
            notiId: userNotiId,
            type: "SCHEDULE_UPDATE"
          };

          sendPushNotification([member.push_token], pushTitle, pushBody, pushData);
        }
      })
    } 

    await connection.commit();

    return res.status(200).json({ 
      code: "SCHEDULE_UPDATE_SUCCESS", 
      message: "스케줄 업데이트 완료"
    });
  } catch(error) {
    if(connection) {
      await connection.rollback();
    }
    return res.status(500).json({ code: "SERVER_ERROR", message: "서버 에러" });
  } finally {
    if(connection) {
      connection.release();
    }
  }
}
  
module.exports = {
  acceptApplicant,
  applySchedule,
  getMonthlySchedules,
  updateSchedule
}