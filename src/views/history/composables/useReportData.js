import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getReportDetail,
  getReportEvaluation,
  getReportTrend,
  getReportAbnormalSnapshots
} from '../api/index'

export function useReportData(taskIdRef) {
  const loading = ref(false)

  const basicInfo = ref({})
  const scores = ref({})
  const summary = ref('')
  const suggestions = ref([])

  const trendData = ref([])
  const abnormalSnapshots = ref([])

  const mediaFileUrl = ref('')
  const mediaDetailList = ref([])
  const mediaDetailMapByFrame = ref({})

  const fetchEvaluation = async () => {
    if (!taskIdRef.value) {
      ElMessage.error('缺少任务ID')
      return
    }
    try {
      const res = await getReportEvaluation(taskIdRef.value)
      basicInfo.value = res.basicInfo || {}
      scores.value = res.scores || {}
      summary.value = res.summary || ''
      suggestions.value = Array.isArray(res.suggestions)
        ? res.suggestions
        : (res.suggestions ? [res.suggestions] : [])
    } catch (error) {
      console.error(error)
      ElMessage.error('获取课堂评估报告详情失败')
    }
  }

  const buildMediaDetailMapByFrame = (details) => {
    const map = {}
    ;(details || []).forEach((item) => {
      const frame = Number(item.frameTime || 0)
      if (!map[frame]) map[frame] = []
      map[frame].push(item)
    })
    mediaDetailMapByFrame.value = map
  }

  const fetchMediaReviewData = async () => {
    if (!taskIdRef.value) return

    try {
      const res = await getReportDetail(taskIdRef.value)

      // 1. 媒体文件和明细
      mediaFileUrl.value = res.fileUrl || ''
      mediaDetailList.value = Array.isArray(res.detailList) ? res.detailList : []
      buildMediaDetailMapByFrame(mediaDetailList.value)

      // 2. 用旧 detail 接口兜底回填基本信息
      basicInfo.value = {
        ...basicInfo.value,
        courseName: basicInfo.value.courseName || res.courseName || '',
        teacherName: basicInfo.value.teacherName || res.teacherName || '',
        classroomName: basicInfo.value.classroomName || res.classroomName || '',
        mediaType: basicInfo.value.mediaType ?? res.mediaType,
        attendanceCount: basicInfo.value.attendanceCount ?? res.attendanceCount
      }

      // 3. 如果 evaluation 没给分数，用旧 detail 的 totalScore 兜底
      scores.value = {
        ...scores.value,
        totalScore: scores.value.totalScore ?? res.totalScore
      }
    } catch (error) {
      console.error(error)
      mediaFileUrl.value = ''
      mediaDetailList.value = []
      mediaDetailMapByFrame.value = {}
    }
  }

  const fetchTrend = async () => {
    if (!taskIdRef.value) return

    try {
      const res = await getReportTrend(taskIdRef.value)
      trendData.value = Array.isArray(res) ? res : (res?.trendData || [])
    } catch (error) {
      console.error(error)
      trendData.value = []
    }
  }

  const fetchAbnormalSnapshots = async () => {
    if (!taskIdRef.value) return

    try {
      const res = await getReportAbnormalSnapshots(taskIdRef.value)
      abnormalSnapshots.value = Array.isArray(res) ? res : (res?.records || res?.list || [])
    } catch (error) {
      console.error(error)
      abnormalSnapshots.value = []
    }
  }

  const fetchAllData = async () => {
    if (!taskIdRef.value) {
      ElMessage.error('缺少任务ID')
      return
    }

    loading.value = true
    try {
      await fetchEvaluation()
      await fetchMediaReviewData()
      await fetchTrend()
      await fetchAbnormalSnapshots()
    } finally {
      loading.value = false
    }
  }

  const toNumber = (value, defaultValue = 0) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : defaultValue
  }

  const normalizeBehaviorName = (item) => {
    return item?.behaviorType || item?.behaviorName || '未识别行为'
  }

  const isRealtimeMedia = computed(() => {
    return Number(basicInfo.value.mediaType) === 3
  })

  const isFileMedia = computed(() => {
    const mediaType = Number(basicInfo.value.mediaType)
    return mediaType === 1 || mediaType === 2
  })

  const behaviorStatList = computed(() => {
    const map = {}
    ;(mediaDetailList.value || []).forEach((item) => {
      const name = normalizeBehaviorName(item)
      const count = toNumber(item.count, 1)
      map[name] = (map[name] || 0) + count
    })

    const total = Object.values(map).reduce((sum, val) => sum + val, 0)

    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        count,
        ratio: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.count - a.count)
  })

  const topBehaviorList = computed(() => behaviorStatList.value.slice(0, 6))

  const attendanceRate = computed(() => {
    const shouldArrive = toNumber(basicInfo.value.studentCount, 0)
    const actualArrive = toNumber(basicInfo.value.attendanceCount, 0)
    if (!shouldArrive) return '-'
    return ((actualArrive / shouldArrive) * 100).toFixed(1)
  })

  return {
    loading,
    basicInfo,
    scores,
    summary,
    suggestions,
    trendData,
    abnormalSnapshots,
    mediaFileUrl,
    mediaDetailList,
    mediaDetailMapByFrame,
    isRealtimeMedia,
    isFileMedia,
    behaviorStatList,
    topBehaviorList,
    attendanceRate,
    fetchAllData
  }
}
