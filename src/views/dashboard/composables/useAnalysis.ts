import { ref, reactive, nextTick, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { WebSocketManager } from '@/utils/WebSocketManager'
import { submitAnalysisTaskApi, fetchTaskStatusApi, fetchTaskDetailApi } from '../api'

interface AnalysisParams {
  mediaType: Ref<'camera' | 'local'>
  selectedClass: Ref<number | null>
  scheduleOptions: Ref<Array<any>>
  currentFile: Ref<File | null>
  uploadedMediaType: Ref<'image' | 'video' | ''>
  mediaDisplayRef: Ref<any>
  detailMapByFrame: Ref<Record<number, any[]>>
  drawBoxes: (details: any[], sourceType: 'camera' | 'image' | 'video') => void
}

export function useAnalysis({
  mediaType,
  selectedClass,
  scheduleOptions,
  currentFile,
  uploadedMediaType,
  mediaDisplayRef,
  detailMapByFrame,
  drawBoxes
}: AnalysisParams) {
  const userStore = useUserStore()
  const isAnalyzing = ref(false)
  const loadingToggle = ref(false)
  const currentTaskId = ref<number | null>(null)

  const attendanceRate = ref(0)
  const focusScore = ref(0)
  const behaviorData = reactive({
    '举手回答问题': 0, '阅读': 0, '趴桌': 0, '起立回答问题': 0, '玩手机': 0, '书写': 0, '正常听课': 0
  })

  const analysisResult = reactive({
    status: 0,
    progress: 0,
    attendanceCount: 0,
    totalScore: 0,
    details: [] as Array<{
      frameTime?: number
      behaviorType: string
      count: number
      boundingBoxes?: number[][]
    }>
  })

  const reportSummary = reactive({
    visible: false,
    attendanceRateText: '-',
    reportLevel: '',
    summaryText: '',
    totalScore: 0,
    attendanceCount: 0
  })

  let wsManager: WebSocketManager | null = null
  let captureTimer: ReturnType<typeof setInterval> | undefined = undefined
  let pollTimer: ReturnType<typeof setInterval> | null = null

  const resetReportSummary = () => {
    reportSummary.visible = false
    reportSummary.attendanceRateText = '-'
    reportSummary.reportLevel = ''
    reportSummary.summaryText = ''
    reportSummary.totalScore = 0
    reportSummary.attendanceCount = 0
  }

  const getReportLevel = (score: number) => {
    if (score >= 90) return '优秀'
    if (score >= 80) return '良好'
    if (score >= 70) return '一般'
    return '需关注'
  }

  const getAttendanceRateText = (attendanceCount: number) => {
    const matched = scheduleOptions.value.find(
      item => Number(item.id || item.scheduleId) === Number(selectedClass.value)
    )
    const expectedCount = Number((matched as any)?.studentCount || 0)
    if (!expectedCount) return '-'
    return `${((attendanceCount / expectedCount) * 100).toFixed(1)}%`
  }

  const buildSummaryText = (score: number) => {
    if (score >= 90) return '本次课堂整体表现优秀，课堂秩序与专注度表现较好。'
    if (score >= 80) return '本次课堂整体表现良好，但仍有进一步优化空间。'
    if (score >= 70) return '本次课堂整体表现一般，建议关注课堂中段的行为波动。'
    return '本次课堂需重点关注，建议结合异常行为结果进一步分析。'
  }

  const normalizeDetails = (details: any[]) => {
    if (!Array.isArray(details)) return []
    return details.map((item) => {
      const boxes = Array.isArray(item.boundingBoxes)
        ? item.boundingBoxes.filter((box: any) => Array.isArray(box) && box.length === 4)
        : []
      const rawCount = Number(item.count || 0)
      const normalizedCount = boxes.length > 0 ? boxes.length : rawCount
      return {
        frameTime: Number(item.frameTime || 0),
        behaviorType: item.behaviorType || '',
        count: normalizedCount,
        boundingBoxes: boxes
      }
    })
  }

  const buildDetailMapByFrame = (details: any[]) => {
    const map: Record<number, any[]> = {}
    details.forEach((item) => {
      const frame = Number(item.frameTime || 0)
      if (!map[frame]) map[frame] = []
      map[frame].push(item)
    })
    detailMapByFrame.value = map
  }

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  const startPolling = (taskId: number) => {
    stopPolling()
    pollTimer = setInterval(async () => {
      try {
        const statusRes: any = await fetchTaskStatusApi(taskId)
  
        analysisResult.status = statusRes.status || 0
        analysisResult.progress = statusRes.progress || 0
        analysisResult.attendanceCount = statusRes.attendanceCount || 0
        analysisResult.totalScore = statusRes.totalScore || 0
  
        attendanceRate.value = analysisResult.attendanceCount
        focusScore.value = analysisResult.totalScore
  
        if (statusRes.status === 2) {
          stopPolling()
          loadingToggle.value = false
          isAnalyzing.value = false
  
          try {
            const detailRes: any = await fetchTaskDetailApi(taskId)
            analysisResult.attendanceCount = detailRes.attendanceCount || analysisResult.attendanceCount
            analysisResult.totalScore = detailRes.totalScore || analysisResult.totalScore
  
            const normalizedDetails = normalizeDetails(detailRes.details || [])
            analysisResult.details = normalizedDetails
  
            buildDetailMapByFrame(normalizedDetails)
  
            attendanceRate.value = analysisResult.attendanceCount
            focusScore.value = analysisResult.totalScore
  
            Object.keys(behaviorData).forEach(k => behaviorData[k as keyof typeof behaviorData] = 0)
            normalizedDetails.forEach((item: any) => {
              if (item.behaviorType in behaviorData) {
                behaviorData[item.behaviorType as keyof typeof behaviorData] = item.count || 0
              }
            })
  
            if (uploadedMediaType.value === 'image') {
              nextTick(() => drawBoxes(detailMapByFrame.value[0] || [], 'image'))
            }
  
            reportSummary.visible = true
            reportSummary.attendanceCount = analysisResult.attendanceCount
            reportSummary.totalScore = analysisResult.totalScore
            reportSummary.reportLevel = getReportLevel(Number(analysisResult.totalScore || 0))
            reportSummary.attendanceRateText = getAttendanceRateText(Number(analysisResult.attendanceCount || 0))
            reportSummary.summaryText = buildSummaryText(Number(analysisResult.totalScore || 0))
  
            ElMessage.success('分析完成，结果已更新到页面')
          } catch (e) {
            console.error('拉取任务详情失败', e)
            ElMessage.warning('分析已完成，但详情加载失败')
          }
        }
  
        if (statusRes.status === 3) {
          stopPolling()
          loadingToggle.value = false
          isAnalyzing.value = false
          ElMessage.error('分析失败，请稍后重试')
        }
      } catch (error) {
        console.error('轮询任务状态失败', error)
        stopPolling()
        loadingToggle.value = false
        isAnalyzing.value = false
        ElMessage.error('获取分析状态失败')
      }
    }, 2000)
  }

  const submitTask = async () => {
    if (!currentFile.value) {
      ElMessage.warning('请先上传需要分析的图片或视频文件！')
      return
    }
    if (!selectedClass.value) {
      ElMessage.warning('请选择要关联的排课信息！')
      return
    }
  
    loadingToggle.value = true
    currentTaskId.value = null
    analysisResult.status = 0
    analysisResult.progress = 0
    analysisResult.attendanceCount = 0
    analysisResult.totalScore = 0
    analysisResult.details = []
    attendanceRate.value = 0
    focusScore.value = 0
    Object.keys(behaviorData).forEach(k => {
      behaviorData[k as keyof typeof behaviorData] = 0
    })
    resetReportSummary()
  
    try {
      const formData = new FormData()
      formData.append('file', currentFile.value)
      formData.append('fileName', currentFile.value.name)
      formData.append('scheduleId', String(selectedClass.value))
      formData.append('streamType', '2')
  
      const res: any = await submitAnalysisTaskApi(formData)
  
      currentTaskId.value = res.taskId
      analysisResult.status = res.status || 0
      isAnalyzing.value = true
  
      ElMessage.success('分析任务创建成功，开始轮询分析结果...')
      startPolling(res.taskId)
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.message || error.message || '任务创建失败，请稍后重试')
      loadingToggle.value = false
    }
  }

  const startCapture = () => {
    stopCapture()
    
    const hiddenCanvas = document.createElement('canvas')
    const ctx = hiddenCanvas.getContext('2d', { willReadFrequently: true })
    
    captureTimer = setInterval(() => {
      const videoRef = mediaDisplayRef.value?.videoRef
      if (!videoRef || !isAnalyzing.value || !wsManager || !wsManager.isConnected || mediaType.value !== 'camera') return
      
      if (videoRef.videoWidth === 0 || videoRef.videoHeight === 0) return
      
      hiddenCanvas.width = videoRef.videoWidth
      hiddenCanvas.height = videoRef.videoHeight
      
      ctx?.drawImage(videoRef, 0, 0, hiddenCanvas.width, hiddenCanvas.height)
      
      const base64Img = hiddenCanvas.toDataURL('image/jpeg', 0.8)
      wsManager.send({ type: 'frame', image: base64Img })
    }, 1000)
  }
  
  const stopCapture = () => {
    if (captureTimer) {
       clearInterval(captureTimer)
       captureTimer = undefined
    }
  }

  const startAnalysis = () => {
    if (!selectedClass.value) {
      ElMessage.warning('请选择要关联的排课信息！')
      return
    }
  
    isAnalyzing.value = true
    ElMessage.success({ message: 'AI引擎启动成功，处理实时流中...', grouping: true })
    
    const token = userStore.token || localStorage.getItem('token') || ''
    const host = window.location.host
    
    wsManager = new WebSocketManager(host, String(selectedClass.value), token)
    
    wsManager.onConnected = () => {
      startCapture()
    }
    
    wsManager.onDisconnected = () => {
      stopCapture()
    }
    
    wsManager.onMessage = (data: any) => {
      if (data.type === 'result') {
        attendanceRate.value = data.attendanceCount || 0
        focusScore.value = data.totalScore || 0
        
        if (data.details) {
          const normalizedDetails = normalizeDetails(data.details)
          Object.keys(behaviorData).forEach(k => behaviorData[k as keyof typeof behaviorData] = 0)
  
          normalizedDetails.forEach((item: any) => {
            if (item.behaviorType in behaviorData) {
              behaviorData[item.behaviorType as keyof typeof behaviorData] = item.count || 0
            }
          })
          drawBoxes(normalizedDetails, 'camera')
        }
      }
    }
    
    wsManager.connect()
  }
  
  const stopAnalysis = (silent = false) => {
    isAnalyzing.value = false
    loadingToggle.value = false
  
    if (!silent) {
      ElMessage.warning({ message: '分析已停止', grouping: true })
    }
  
    stopCapture()
    stopPolling()
    currentTaskId.value = null
    detailMapByFrame.value = {}
  
    if (wsManager) {
      wsManager.close()
      wsManager = null
    }
  
    attendanceRate.value = 0
    focusScore.value = 0
    Object.keys(behaviorData).forEach(k => {
      behaviorData[k as keyof typeof behaviorData] = 0
    })
    resetReportSummary()
  
    const canvas = mediaDisplayRef.value?.boxCanvas
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }
  
  const toggleAnalysis = () => {
    if (isAnalyzing.value) {
      stopAnalysis()
    } else {
      if (mediaType.value === 'local') {
        submitTask()
      } else {
        loadingToggle.value = true
        setTimeout(() => {
          startAnalysis()
          loadingToggle.value = false
        }, 600)
      }
    }
  }

  return {
    isAnalyzing,
    loadingToggle,
    currentTaskId,
    attendanceRate,
    focusScore,
    behaviorData,
    analysisResult,
    reportSummary,
    toggleAnalysis,
    stopAnalysis,
    stopPolling,
    resetReportSummary
  }
}
