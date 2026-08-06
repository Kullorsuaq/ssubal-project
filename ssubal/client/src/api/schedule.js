import { authApi, publicApi } from './instance';

export const acceptApplicant = (groupId, applicantId) => { //applicantId는 substitute_applicants의 id
  return authApi.patch(`/groups/${groupId}/schedules/applicant/${applicantId}/accept`);
}

export const applySchedule = (groupId, applicantData) => {
  return authApi.post(`/groups/${groupId}/schedules/applicant`, applicantData);
}

export const getMonthlySchedules = (groupId, year, month) => {
  return authApi.get(`/groups/${groupId}/schedules?year=${year}&month=${month}`);
}

//CalendarDetail에서 하루 스케줄 변경하기
export const updateSchedule = (groupId, { date, scheduleData }) => {
  return authApi.put(`/groups/${groupId}/schedules`, { date, scheduleData });
}