const express = require("express");
const scheduleRouter = express.Router({ mergeParams: true });
const { checkGroupMember, checkAdminOrOwner } = require("../guards/groupGuard");

const { applySchedule, acceptApplicant, getMonthlySchedules, updateSchedule } = require("../controller/scheduleController");

scheduleRouter.use(checkGroupMember); //아래 모든 라우트에 공통으로 검증

//group/:groupId/schedules
scheduleRouter.patch('/applicant/:applicantId/accept', acceptApplicant);
scheduleRouter.post('/applicant', applySchedule);
scheduleRouter.get('/', getMonthlySchedules);
scheduleRouter.put('/', checkAdminOrOwner, updateSchedule);
module.exports = scheduleRouter;