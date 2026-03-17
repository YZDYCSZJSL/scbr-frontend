import request from '@/utils/request'

export interface ScheduleAnalysisVO {
  id: number
  scheduleId?: number
  courseId: number
  courseName: string
  classroomId: number
  classroomName: string
  teacherId: number
  teacherName: string
  academicYear: string
  semester: number
  weekday: number
  startSectionNo: number
  endSectionNo: number
  startSectionTime: string
  endSectionTime: string
  startWeek: number
  endWeek: number
  weekType: number
  studentCount: number
  status?: number
}

export interface ScheduleAnalysisInitVO {
  scheduleId: number
  academicYear: string
  semester: number
  courseId: number
  courseName: string
  teacherId: number
  teacherName: string
  classroomId: number
  classroomName: string
  weekday: number
  weekdayName: string
  startSectionId: number
  startSectionNo: number
  endSectionId: number
  endSectionNo: number
  sectionRangeText: string
  sectionTimeText: string
  startWeek: number
  endWeek: number
  weekType: number
  weekTypeName: string
  weekRangeText: string
  studentCount: number
  remark: string
}

export const fetchScheduleListApi = async (streamType: number) => {
  return await request({ 
    url: '/admin/schedule/analysis-list', 
    method: 'get', 
    params: { streamType } 
  })
}

export const submitAnalysisTaskApi = async (formData: FormData) => {
  return await request({
    url: '/analysis/task',
    method: 'post',
    data: formData
  })
}

export const fetchTaskStatusApi = async (taskId: number) => {
  return await request({
    url: `/analysis/task/${taskId}/status`,
    method: 'get'
  })
}

export const fetchTaskDetailApi = async (taskId: number) => {
  return await request({
    url: `/analysis/task/${taskId}/detail`,
    method: 'get'
  })
}
