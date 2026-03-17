<template>
  <div class="flex flex-col h-full space-y-4">
    <!-- Top Control Bar -->
    <TopControlBar
      v-model:selectedClass="selectedClass"
      v-model:mediaType="mediaType"
      :scheduleOptions="scheduleOptions"
      :isAnalyzing="isAnalyzing"
      :loadingToggle="loadingToggle"
      @toggleAnalysis="toggleAnalysis"
    />

    <el-alert
      v-if="scheduleAnalysisInit"
      :title="`已带入排课：${scheduleAnalysisInit.courseName} / ${scheduleAnalysisInit.classroomName} / ${scheduleAnalysisInit.weekdayName} / ${scheduleAnalysisInit.sectionRangeText}`"
      type="success"
      :closable="false"
      show-icon
    />

    <!-- Main Content Grid -->
    <div class="flex-1 flex space-x-4 overflow-hidden min-h-[600px]">
      
      <!-- Left: Media Display and Bounding Box Canvas -->
      <MediaDisplay
        ref="mediaDisplayRef"
        :mediaType="mediaType"
        :isAnalyzing="isAnalyzing"
        :uploadedMediaUrl="uploadedMediaUrl"
        :uploadedMediaType="uploadedMediaType"
        @removeFile="handleRemoveFile"
        @fileChange="handleFileChange"
        @imageLoad="handleImageLoad"
        @videoTimeUpdate="handleLocalVideoTimeUpdate"
      />

      <!-- Right: Real-time Data Dashboard -->
      <DataDashboard
        :attendanceRate="attendanceRate"
        :focusScore="focusScore"
        :behaviorData="behaviorData"
      />
      
    </div>

    <div
  v-if="reportSummary.visible && mediaType === 'local'"
  class="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
>
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
    <div>
      <div class="text-sm text-gray-500 mb-1">本次课堂评估摘要</div>
      <h3 class="text-lg font-semibold text-gray-900">分析已完成，可查看完整课堂评估报告</h3>
    </div>

    <div class="flex items-center gap-3">
      <el-tag
        :type="
          reportSummary.reportLevel === '优秀'
            ? 'success'
            : reportSummary.reportLevel === '良好'
              ? 'primary'
              : reportSummary.reportLevel === '一般'
                ? 'warning'
                : 'danger'
        "
        effect="light"
      >
        {{ reportSummary.reportLevel || '未评级' }}
      </el-tag>

      <el-button type="primary" @click="goToReportDetail">
        查看完整报告
      </el-button>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    <div class="rounded-xl bg-gray-50 border border-gray-100 p-4">
      <div class="text-sm text-gray-500 mb-2">综合评分</div>
      <div class="text-3xl font-bold text-gray-900">{{ reportSummary.totalScore || 0 }}</div>
    </div>

    <div class="rounded-xl bg-gray-50 border border-gray-100 p-4">
      <div class="text-sm text-gray-500 mb-2">实到人数</div>
      <div class="text-3xl font-bold text-gray-900">{{ reportSummary.attendanceCount || 0 }}</div>
    </div>

    <div class="rounded-xl bg-gray-50 border border-gray-100 p-4">
      <div class="text-sm text-gray-500 mb-2">出勤率</div>
      <div class="text-3xl font-bold text-gray-900">{{ reportSummary.attendanceRateText }}</div>
    </div>
  </div>

  <div class="rounded-xl bg-blue-50 border border-blue-100 px-4 py-4 text-sm text-gray-700 leading-7">
    {{ reportSummary.summaryText }}
  </div>
</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { WebSocketManager } from '@/utils/WebSocketManager'
import { useRoute, useRouter } from 'vue-router'

import TopControlBar from './components/TopControlBar.vue'
import MediaDisplay from './components/MediaDisplay.vue'
import DataDashboard from './components/DataDashboard.vue'

import { fetchScheduleListApi, submitAnalysisTaskApi, fetchTaskStatusApi, fetchTaskDetailApi } from './api'
import type { ScheduleAnalysisVO, ScheduleAnalysisInitVO } from './api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const prefillApplied = ref(false)
const scheduleAnalysisInit = ref<ScheduleAnalysisInitVO | null>(null)

const selectedClass = ref<number | null>(null)
const mediaType = ref<'camera' | 'local'>('local')
const scheduleOptions = ref<ScheduleAnalysisVO[]>([])
const isAnalyzing = ref(false)
const loadingToggle = ref(false)
const uploadedMediaUrl = ref<string>('')
const uploadedMediaType = ref<'image' | 'video' | ''>('')
const currentFile = ref<File | null>(null)

const currentTaskId = ref<number | null>(null)
const pollTimer = ref<ReturnType<typeof setInterval> | null>(null)
const detailMapByFrame = ref<Record<number, any[]>>({})

const mediaDisplayRef = ref<InstanceType<typeof MediaDisplay> | null>(null)

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

// 摄像头相关变量
let mediaStream: MediaStream | null = null

// 开启摄像头硬件调用
const startCamera = async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { aspectRatio: 16 / 9, facingMode: 'environment' }, 
      audio: false
    })
    const videoRef = mediaDisplayRef.value?.videoRef
    if (videoRef) {
      videoRef.srcObject = mediaStream
      videoRef.play().catch(e => console.error('视频流播放失败:', e))
    }
  } catch (error) {
    console.error('获取摄像头权限失败或无可用摄像头设备:', error)
    ElMessage.error('无法调用摄像头，请确认浏览器已授予摄像头权限且设备连接正常。')
  }
}

// 停止流
const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  const videoRef = mediaDisplayRef.value?.videoRef
  if (videoRef) {
    videoRef.srcObject = null
  }
}

const readScheduleAnalysisInit = (): ScheduleAnalysisInitVO | null => {
  try {
    const raw = sessionStorage.getItem('scheduleAnalysisInit')
    if (!raw) return null
    return JSON.parse(raw)
  } catch (error) {
    console.error('解析 scheduleAnalysisInit 失败', error)
    return null
  }
}

const applySchedulePrefill = () => {
  if (prefillApplied.value) return
  if (route.query.prefill !== '1') return

  const init = readScheduleAnalysisInit()
  if (!init || !init.scheduleId) return

  scheduleAnalysisInit.value = init

  const matched = scheduleOptions.value.find(
    item => Number(item.id || item.scheduleId) === Number(init.scheduleId)
  )

  if (matched) {
    selectedClass.value = Number(matched.id || matched.scheduleId)
    prefillApplied.value = true
    ElMessage.success('已自动带入排课信息，请继续上传文件或启动实时分析')
  }
}

const fetchScheduleList = async () => {
  try {
    const streamType = mediaType.value === 'camera' ? 1 : 2
    const response: any = await fetchScheduleListApi(streamType)
    
    const dataList = response?.records || response?.data || response
    scheduleOptions.value = Array.isArray(dataList) ? dataList : []
    applySchedulePrefill()
  } catch (error) {
    console.error('获取排课列表失败', error)
    scheduleOptions.value = []
  }
}

watch(mediaType, async (newVal) => {
  await fetchScheduleList()
  if (newVal === 'camera') {
    if (uploadedMediaUrl.value) handleRemoveFile()
    await nextTick()
    startCamera()
  } else {
    stopCamera()
  }
})

onMounted(async () => {
  await fetchScheduleList()
  applySchedulePrefill()
})

const handleRemoveFile = () => {
  if (uploadedMediaUrl.value) {
    URL.revokeObjectURL(uploadedMediaUrl.value)
  }
  
  uploadedMediaUrl.value = ''
  uploadedMediaType.value = ''
  currentFile.value = null
  
  const uploadRef = mediaDisplayRef.value?.uploadRef
  if (uploadRef) uploadRef.clearFiles()

  const uploadInput = document.querySelector('.el-upload__input') as HTMLInputElement | null
  if (uploadInput) uploadInput.value = ''
  
  detailMapByFrame.value = {}
  currentTaskId.value = null
  resetReportSummary()

  const canvas = mediaDisplayRef.value?.boxCanvas
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

const handleFileChange = (file: any) => {
  if (file.raw) {
    const isImage = file.raw.type.startsWith('image/')
    const isVideo = file.raw.type.startsWith('video/')
    
    if (!isImage && !isVideo) {
      ElMessage.error('上传失败：不支持该类型文件，请上传图片或视频。')
      handleRemoveFile()
      return false
    }

    if (isImage) {
      if (file.raw.size / 1024 / 1024 > 10) {
        ElMessage.error('上传失败：图片大小不能超过 10MB！')
        handleRemoveFile()
        return false
      }
    } else if (isVideo) {
      if (file.raw.size / 1024 / 1024 > 500) {
        ElMessage.error('上传失败：视频大小不能超过 500MB！')
        handleRemoveFile()
        return false
      }
    }

    uploadedMediaType.value = isImage ? 'image' : 'video'
    uploadedMediaUrl.value = URL.createObjectURL(file.raw)
    currentFile.value = file.raw
    ElMessage.success('文件已加载，可启动分析')
  }
}

const attendanceRate = ref(0)
const focusScore = ref(0)
const behaviorData = reactive({
  '举手回答问题': 0, '阅读': 0, '趴桌': 0, '起立回答问题': 0, '玩手机': 0, '书写': 0, '正常听课': 0
})


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

const goToReportDetail = () => {
  if (!currentTaskId.value) {
    ElMessage.warning('当前任务暂无可跳转的报告')
    return
  }

  router.push({
    name: 'HistoryDetail',
    params: { taskId: currentTaskId.value }
  })
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

const stopPolling = () => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
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

const startPolling = (taskId: number) => {
  stopPolling()
  pollTimer.value = setInterval(async () => {
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

const drawBoxes = (details: any[], sourceType: 'camera' | 'image' | 'video') => {
  const canvas = mediaDisplayRef.value?.boxCanvas
  if (!canvas) return

  let sourceEl: HTMLVideoElement | HTMLImageElement | null = null
  let sourceWidth = 0
  let sourceHeight = 0

  if (sourceType === 'camera') {
    const video = mediaDisplayRef.value?.videoRef
    if (!video || !video.videoWidth || !video.videoHeight) return
    sourceEl = video
    sourceWidth = video.videoWidth
    sourceHeight = video.videoHeight
  }

  if (sourceType === 'image') {
    const img = mediaDisplayRef.value?.imageRef
    if (!img || !img.naturalWidth || !img.naturalHeight) return
    sourceEl = img
    sourceWidth = img.naturalWidth
    sourceHeight = img.naturalHeight
  }

  if (sourceType === 'video') {
    const video = mediaDisplayRef.value?.localVideoRef
    if (!video || !video.videoWidth || !video.videoHeight) return
    sourceEl = video
    sourceWidth = video.videoWidth
    sourceHeight = video.videoHeight
  }

  if (!sourceEl) return

  if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const canvasRect = canvas.getBoundingClientRect()
  const mediaRect = sourceEl.getBoundingClientRect()

  const scaleX = mediaRect.width / sourceWidth
  const scaleY = mediaRect.height / sourceHeight
  const offsetX = mediaRect.left - canvasRect.left
  const offsetY = mediaRect.top - canvasRect.top

  details.forEach(detail => {
    const behavior = detail.behaviorType
    const isNegative = ['玩手机', '趴桌'].includes(behavior)
    const color = isNegative ? '#ef4444' : '#10b981'
    const rgbaBg = isNegative ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)'

    if (detail.boundingBoxes && Array.isArray(detail.boundingBoxes)) {
      detail.boundingBoxes.forEach((box: number[]) => {
        const [x1, y1, x2, y2] = box
        const x = offsetX + x1 * scaleX
        const y = offsetY + y1 * scaleY
        const w = (x2 - x1) * scaleX
        const h = (y2 - y1) * scaleY

        ctx.fillStyle = rgbaBg
        ctx.fillRect(x, y, w, h)
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, w, h)

        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif'
        const textWidth = ctx.measureText(behavior).width
        const labelY = y - 28 < 0 ? y : y - 28

        ctx.fillStyle = color
        ctx.fillRect(x, labelY, textWidth + 16, 26)
        ctx.fillStyle = '#fff'
        ctx.fillText(behavior, x + 8, labelY + 18)
      })
    }
  })
}

const handleImageLoad = () => {
  drawBoxes(detailMapByFrame.value[0] || [], 'image')
}

const handleLocalVideoTimeUpdate = () => {
  const video = mediaDisplayRef.value?.localVideoRef
  if (!video) return
  const currentSecond = Math.floor(video.currentTime || 0)
  const details = detailMapByFrame.value[currentSecond] || []
  drawBoxes(details, 'video')
}

onUnmounted(() => {
  stopPolling()
  stopAnalysis(true)
  stopCamera()
})
</script>
