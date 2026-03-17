import request from '@/utils/request'

export const fetchTeacherOptions = () => request.get('/admin/teacher/page', { params: { page: 1, size: 1000, status: 1 } })
export const fetchCourseOptions = () => request.get('/admin/course/page', { params: { page: 1, size: 1000, status: 1 } })
export const fetchClassroomOptions = () => request.get('/admin/classroom/page', { params: { page: 1, size: 1000, status: 1 } })
export const fetchSectionTimeList = () => request.get('/admin/schedule/section-time/list')
export const fetchSemesterOptions = () => request.get('/admin/semester-config/options')

export const fetchSchedulePage = (params) => request.get('/admin/schedule/page', { params })
export const fetchScheduleWeekView = (params) => request.get('/admin/schedule/week-view', { params })

export const addSchedule = (data) => request.post('/admin/schedule', data)
export const updateSchedule = (data) => request.put('/admin/schedule', data)
export const deleteSchedule = (id) => request.delete(`/admin/schedule/${id}`)

export const fetchAnalysisInit = (scheduleId) => request.get(`/admin/schedule/${scheduleId}/analysis-init`)
