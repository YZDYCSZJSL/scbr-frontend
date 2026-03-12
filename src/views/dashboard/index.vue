<template>
  <div class="flex flex-col h-full space-y-4">
    <!-- Top Control Bar -->
    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <span class="font-bold text-gray-700 text-lg">实时课堂分析</span>
        <!-- Schedule Selector -->
        <el-select 
          v-model="selectedClass" 
          placeholder="请选择要分析的课程" 
          popper-class="!rounded-xl shadow-lg"
          class="w-80"
        >
          <template #prefix>
            <el-icon><Calendar /></el-icon>
          </template>
          <el-option
            v-for="item in scheduleOptions"
            :key="item.id || item.scheduleId"
            :label="`${item.courseName} (${item.classroomName})`"
            :value="item.id || item.scheduleId"
            class="!h-auto !py-2"
          >
            <div class="flex flex-col leading-tight">
              <span class="font-bold text-gray-800 text-sm mb-1 truncate">{{ item.courseName }} - {{ item.classroomName }} - 讲师：{{ item.teacherName }}</span>
              <span class="text-xs text-gray-400">时间：{{ item.startTime }} 至 {{ item.endTime }}</span>
            </div>
          </el-option>
        </el-select>
        
        <!-- Media Source Type Switch -->
        <el-radio-group v-model="mediaType" size="default" class="bg-gray-100 p-1 rounded-lg">
          <el-radio-button label="camera" class="!border-none">
            <div class="flex items-center space-x-1 px-2">
              <el-icon><Camera /></el-icon><span>实时流</span>
            </div>
          </el-radio-button>
          <el-radio-button label="local" class="!border-none">
            <div class="flex items-center space-x-1 px-2">
              <el-icon><VideoCamera /></el-icon><span>文件流</span>
            </div>
          </el-radio-button>
        </el-radio-group>
      </div>

      <div class="flex items-center">
        <!-- Start Analysis Button -->
        <el-button 
          :type="isAnalyzing ? 'danger' : 'primary'" 
          size="large" 
          :loading="loadingToggle" 
          class="!font-bold !px-8 shadow-md rounded-lg transition-transform hover:scale-105"
          @click="toggleAnalysis"
        >
          <template #icon>
            <el-icon v-if="!loadingToggle">
              <VideoPause v-if="isAnalyzing"/>
              <VideoPlay v-else/>
            </el-icon>
          </template>
          {{ isAnalyzing ? '停止实况分析' : (loadingToggle ? '正在创建分析任务...' : '启动AI识别') }}
        </el-button>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="flex-1 flex space-x-4 overflow-hidden min-h-[600px]">
      
      <!-- Left: Media Display and Bounding Box Canvas -->
      <div class="flex-[2] bg-gray-950 rounded-xl overflow-hidden relative shadow-lg ring-1 ring-gray-900 border-gray-900 border flex flex-col">
        <!-- 媒体占位背景 / 视频 -->
        <div class="absolute inset-0 flex items-center justify-center">
           <!-- Placeholder, in real production you will use `<video>` here -->
           <template v-if="mediaType === 'local'">
             <div v-show="uploadedMediaUrl" class="relative group w-full h-full flex items-center justify-center bg-black">
               <img 
                  v-if="uploadedMediaType === 'image'"
                  :src="uploadedMediaUrl" 
                  class="preview-image opacity-80 z-0"
               />
               <video 
                  v-else-if="uploadedMediaType === 'video'"
                  :src="uploadedMediaUrl" 
                  class="preview-video opacity-80 z-0"
                  controls
               ></video>
               
               <!-- 悬浮操作层: 非侵入式按钮定位在右上角 -->
               <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                 <el-button type="danger" circle size="large" @click="handleRemoveFile" title="删除文件重新上传" class="shadow-lg !bg-black/50 hover:!bg-red-500/80 !border-none">
                   <template #icon><el-icon><Delete /></el-icon></template>
                 </el-button>
               </div>
             </div>
             <div v-show="!uploadedMediaUrl" class="w-1/2 h-1/2 min-w-[300px] flex items-center justify-center">
               <el-upload
                 ref="uploadRef"
                 class="w-full"
                 drag
                 action="#"
                 :auto-upload="false"
                 :show-file-list="false"
                 :on-change="handleFileChange"
                 accept="image/*,video/*"
               >
                 <el-icon class="el-icon--upload !text-6xl text-gray-400 mb-4"><UploadFilled /></el-icon>
                 <div class="el-upload__text text-gray-300 text-lg group-hover:text-blue-400 transition-colors">
                   点击或将图片/视频拖拽至此处上传
                 </div>
                 <template #tip>
                   <div class="el-upload__tip text-gray-500 text-center mt-2">
                     支持 jpg/png/mp4 等格式文件
                   </div>
                 </template>
               </el-upload>
             </div>
           </template>
           <!-- 摄像头实时流渲染区域 -->
           <div v-else class="w-full h-full flex items-center justify-center bg-black relative">
             <video 
               ref="videoRef"
               class="camera-video z-0"
               autoplay
               playsinline
               muted
             ></video>
           </div>
        </div>
        
        <!-- Overlay Canvas for AI detection boxes -->
        <canvas ref="boxCanvas" class="absolute inset-0 w-full h-full z-10 pointer-events-none"></canvas>
        
        <!-- Status Overlay -->
        <div v-if="mediaType !== 'local'" class="absolute top-4 left-4 z-20 flex space-x-3">
          <span class="px-4 py-1.5 bg-black/60 text-white rounded-lg text-sm backdrop-blur-md border border-gray-700/50 flex items-center font-medium shadow-lg">
            <span class="w-2.5 h-2.5 rounded-full mr-2.5" :class="isAnalyzing ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-red-500'"></span>
            {{ isAnalyzing ? 'AI引擎运行中' : '引擎待机' }}
          </span>
          <span class="px-3 py-1.5 bg-black/60 text-white rounded-lg text-sm backdrop-blur-md border border-gray-700/50 font-mono">
            FPS: <span :class="isAnalyzing ? 'text-green-400' : 'text-gray-400'">{{ isAnalyzing ? '29.97' : '0.00' }}</span>
          </span>
        </div>
      </div>

      <!-- Right: Real-time Data Dashboard -->
      <div class="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col overflow-y-auto">
        <h3 class="font-bold text-lg text-gray-800 border-b pb-3 mb-4 flex items-center">
          <span class="p-1.5 bg-blue-100 text-blue-600 rounded-lg mr-2">
            <el-icon><DataAnalysis /></el-icon>
          </span>
          实时数据面板
        </h3>
        
        <!-- Key Metrics Cards -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden group">
            <div class="absolute -right-4 -top-4 w-16 h-16 bg-blue-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
            <div class="text-sm text-blue-600 font-medium mb-1">实时出勤率</div>
            <div class="text-3xl font-black text-blue-800 flex items-end">
              {{ attendanceRate }}<span class="text-lg font-bold ml-1 text-blue-600">%</span>
            </div>
            <div class="text-xs text-blue-500/80 mt-2 font-medium">应到 45 / 实到 {{ Math.floor(45 * attendanceRate / 100) }}</div>
          </div>
          
          <div class="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden group">
            <div class="absolute -right-4 -top-4 w-16 h-16 bg-emerald-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
            <div class="text-sm text-emerald-600 font-medium mb-1">班级专注度得分</div>
            <div class="text-3xl font-black text-emerald-800 flex items-end">
              {{ focusScore }}<span class="text-lg font-bold ml-1 text-emerald-600">分</span>
            </div>
            <div class="text-xs text-emerald-500/80 mt-2 font-medium">学习状态良好</div>
          </div>
        </div>

        <!-- 8 Behavior Statistics -->
        <div class="flex-1 flex flex-col">
          <h4 class="text-xs font-bold text-gray-500 mb-3 px-1 uppercase tracking-wider flex items-center justify-between">
            <span>行为分类识别分布</span>
            <span class="text-gray-400 font-normal">实时人数</span>
          </h4>
          <div class="space-y-2.5">
            <div v-for="(count, behavior) in behaviorData" :key="behavior" 
              class="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm transition-all group"
            >
              <div class="flex items-center">
                <!-- Color dot representation based on behavior positive/negative -->
                <span 
                  class="w-2.5 h-2.5 rounded-full mr-3 shadow-sm ring-2 ring-white"
                  :class="getBehaviorDotColor(behavior)"
                ></span>
                <span class="font-medium text-gray-700 group-hover:text-blue-900 transition-colors">{{ behavior }}</span>
              </div>
              <div class="flex items-center space-x-3">
                <!-- Mini Progress Bar Context -->
                <div class="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden hidden xl:block">
                  <div class="h-full rounded-full transition-all duration-500" 
                       :class="getBehaviorDotColor(behavior).replace('bg-','bg-')" 
                       :style="`width: ${Math.min((count/45)*100, 100)}%`">
                  </div>
                </div>
                <span class="font-bold text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm w-16 text-center tabular-nums">
                  {{ count }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Camera, VideoCamera, VideoPlay, VideoPause, DataAnalysis, UploadFilled, Delete, Calendar } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { useUserStore } from '@/store/user'
import { WebSocketManager } from '@/utils/WebSocketManager'

// --- TypeScript Definitions ---
export interface ScheduleAnalysisVO {
  id: number; // 后端实际返回的是 id
  scheduleId?: number; // 兼容可能存在的旧格式
  courseId: number;
  courseName: string;
  classroomId: number;
  classroomName: string;
  teacherId: number;
  teacherName: string;
  startTime: string; // "YYYY-MM-DD HH:mm:ss"
  endTime: string;
  status: number;
}
// --- // TypeScript Definitions ---

const selectedClass = ref<number | null>(null)
const mediaType = ref<'camera' | 'local'>('local')
const scheduleOptions = ref<ScheduleAnalysisVO[]>([])
const isAnalyzing = ref(false)
const loadingToggle = ref(false)
const boxCanvas = ref<HTMLCanvasElement | null>(null)
const uploadedMediaUrl = ref<string>('')
const uploadedMediaType = ref<'image' | 'video' | ''>('')
const uploadRef = ref<any>(null)
const currentFile = ref<File | null>(null)

const currentTaskId = ref<number | null>(null)
const pollTimer = ref<ReturnType<typeof setInterval> | null>(null)

const analysisResult = reactive({
  status: 0,
  progress: 0,
  attendanceCount: 0,
  totalScore: 0,
  details: [] as Array<{
    behaviorType: string
    count: number
    boundingBoxes?: number[][]
  }>
})

const userStore = useUserStore()
let wsManager: WebSocketManager | null = null
let captureTimer: ReturnType<typeof setInterval> | undefined = undefined

// 摄像头相关变量
const videoRef = ref<HTMLVideoElement | null>(null)
let mediaStream: MediaStream | null = null

// 开启摄像头硬件调用
const startCamera = async () => {
  try {
    // 请求调用电脑自带视频输入设备（摄像头）
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { 
        aspectRatio: 16 / 9,
        facingMode: 'environment' // 倾向于使用后置/外接广角摄像头（如果设备有多个）
      }, 
      audio: false // 针对实时画面分析，不需要调用麦克风
    })
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      // 捕获可能因浏览器自动播放策略限制带来的错误
      videoRef.value.play().catch(e => console.error('视频流播放失败:', e))
    }
  } catch (error) {
    console.error('获取摄像头权限失败或无可用摄像头设备:', error)
    ElMessage.error('无法调用摄像头，请确认浏览器已授予摄像头权限且设备连接正常。')
  }
}

// 停止流，彻底释放硬件资源（防止摄像头指示灯长亮）
const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => {
      track.stop() // 彻底停止媒体轨道，释放硬件资源
    })
    mediaStream = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

// 拉取排课数据的请求函数
const fetchScheduleList = async () => {
  // 1. 切换时清空当前选中项
  selectedClass.value = null
  
  try {
    const streamType = mediaType.value === 'camera' ? 1 : 2
    // utils/request.js 已经配置了 baseURL: '/api/v1' 并且通过拦截器脱壳了 res.data
    const response: any = await request({ 
      url: '/admin/schedule/analysis-list', 
      method: 'get', 
      params: { streamType } 
    })
    
    // axios interceptor returned res.data which often contains `.records` if using pagination (MyBatis Plus Page)
    // and `.items` if using other common frameworks. Check multiple possible layers:
    const dataList = response?.records || response?.data || response
    scheduleOptions.value = Array.isArray(dataList) ? dataList : []
  } catch (error) {
    console.error('获取排课列表失败', error)
    scheduleOptions.value = []
  }
}

// 监听媒体类型切换
watch(mediaType, async (newVal) => {
  fetchScheduleList()
  if (newVal === 'camera') {
    // 切换到实时流时，清理之前上传的文件流，释放内存
    if (uploadedMediaUrl.value) {
      handleRemoveFile()
    }
    // 等待 DOM 更新渲染出 video 后再调用摄像头
    await nextTick()
    startCamera()
  } else {
    // 切换离开时关闭摄像头彻底释放资源
    stopCamera()
  }
})

onMounted(() => {
  fetchScheduleList()
})

const handleRemoveFile = () => {
  // 1. 释放创建的 ObjectURL 防止内存泄漏
  if (uploadedMediaUrl.value) {
    URL.revokeObjectURL(uploadedMediaUrl.value)
  }
  
  // 2. 清除绑定的状态变量
  uploadedMediaUrl.value = ''
  uploadedMediaType.value = ''
  currentFile.value = null
  
  // 3. 同步清理 el-upload 和底层的 input
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  const uploadInput = document.querySelector('.el-upload__input') as HTMLInputElement | null
  if (uploadInput) {
    uploadInput.value = ''
  }
}

const handleFileChange = (file: any) => {
  if (file.raw) {
    const isImage = file.raw.type.startsWith('image/')
    const isVideo = file.raw.type.startsWith('video/')
    
    if (!isImage && !isVideo) {
      ElMessage.error('上传失败：不支持该类型文件，请上传图片或视频。')
      handleRemoveFile() // 相当于清空可能遗留的底层文件选中状态
      return false
    }

    // 文件体积拦截校验
    if (isImage) {
      const isLt10M = file.raw.size / 1024 / 1024 < 10
      if (!isLt10M) {
        ElMessage.error('上传失败：图片大小不能超过 10MB！')
        handleRemoveFile()
        return false
      }
    } else if (isVideo) {
      const isLt500M = file.raw.size / 1024 / 1024 < 500
      if (!isLt500M) {
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

// Mock Data states
const attendanceRate = ref(0)
const focusScore = ref(0)
const behaviorData = reactive({
  '举手回答问题': 0,
  '阅读': 0,
  '趴桌': 0,
  '起立回答问题': 0,
  '玩手机': 0,
  '书写': 0,
  '正常听课': 0
})

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

  // 清空旧结果
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

  try {
    const formData = new FormData()
    formData.append('file', currentFile.value)
    formData.append('fileName', currentFile.value.name)
    formData.append('scheduleId', String(selectedClass.value))
    formData.append('streamType', '2')

    const res: any = await request({
      url: '/analysis/task',
      method: 'post',
      data: formData
    })

    // request.js 已经返回 res.data，所以这里 res 直接就是 { taskId, status }
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

const fetchTaskStatus = async (taskId: number) => {
  return await request({
    url: `/analysis/task/${taskId}/status`,
    method: 'get'
  })
}

// 这个接口需要后端补充：GET /api/v1/analysis/task/{taskId}/detail
const fetchTaskDetail = async (taskId: number) => {
  return await request({
    url: `/analysis/task/${taskId}/detail`,
    method: 'get'
  })
}

const startPolling = (taskId: number) => {
  stopPolling()

  pollTimer.value = setInterval(async () => {
    try {
      const statusRes: any = await fetchTaskStatus(taskId)

      analysisResult.status = statusRes.status || 0
      analysisResult.progress = statusRes.progress || 0
      analysisResult.attendanceCount = statusRes.attendanceCount || 0
      analysisResult.totalScore = statusRes.totalScore || 0

      // 同步到页面已有统计卡片
      attendanceRate.value = analysisResult.attendanceCount
      focusScore.value = analysisResult.totalScore

      // 分析成功
      if (statusRes.status === 2) {
  stopPolling()
  loadingToggle.value = false
  isAnalyzing.value = false

  try {
    const detailRes: any = await fetchTaskDetail(taskId)

    analysisResult.attendanceCount = detailRes.attendanceCount || analysisResult.attendanceCount
    analysisResult.totalScore = detailRes.totalScore || analysisResult.totalScore
    analysisResult.details = detailRes.details || []

    attendanceRate.value = analysisResult.attendanceCount
    focusScore.value = analysisResult.totalScore

    // 先清零，再回填行为统计
    Object.keys(behaviorData).forEach(k => {
      behaviorData[k as keyof typeof behaviorData] = 0
    })

    analysisResult.details.forEach((item: any) => {
      if (item.behaviorType in behaviorData) {
        behaviorData[item.behaviorType as keyof typeof behaviorData] = item.count || 0
      }
    })

    ElMessage.success('分析完成，结果已更新到页面')
  } catch (e) {
    console.error('拉取任务详情失败', e)
    ElMessage.warning('分析已完成，但详情加载失败')
  }
}

      // 分析失败
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
    console.log('【WS】 已连接，开始推流...')
    startCapture()
  }
  
  wsManager.onDisconnected = () => {
    console.log('【WS】 连接断开，停止抓帧')
    stopCapture()
  }
  
  wsManager.onMessage = (data: any) => {
    if (data.type === 'result') {
      attendanceRate.value = data.attendanceCount || 0
      focusScore.value = data.totalScore || 0
      
      if (data.details) {
        Object.keys(behaviorData).forEach(k => behaviorData[k as keyof typeof behaviorData] = 0)
        data.details.forEach((item: any) => {
          behaviorData[item.behaviorType] = item.count || 0
        })
        
        drawRealBoxes(data.details)
      }
    }
  }
  
  wsManager.connect()
}

const stopAnalysis = () => {
  isAnalyzing.value = false
  ElMessage.warning({ message: '分析已停止', grouping: true })
  
  stopCapture()
  stopPolling()
  currentTaskId.value = null
  
  if (wsManager) {
    wsManager.close()
    wsManager = null
  }
  
  attendanceRate.value = 0
  focusScore.value = 0
  Object.keys(behaviorData).forEach(k => {
    behaviorData[k as keyof typeof behaviorData] = 0
  })
  
  const canvas = boxCanvas.value
  if(canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

const startCapture = () => {
  stopCapture()
  
  const hiddenCanvas = document.createElement('canvas')
  const ctx = hiddenCanvas.getContext('2d', { willReadFrequently: true })
  
  captureTimer = setInterval(() => {
    if (!videoRef.value || !isAnalyzing.value || !wsManager || !wsManager.isConnected || mediaType.value !== 'camera') return
    
    const video = videoRef.value
    if (video.videoWidth === 0 || video.videoHeight === 0) return
    
    hiddenCanvas.width = video.videoWidth
    hiddenCanvas.height = video.videoHeight
    
    ctx?.drawImage(video, 0, 0, hiddenCanvas.width, hiddenCanvas.height)
    
    // image/jpeg; 0.8 quality
    const base64Img = hiddenCanvas.toDataURL('image/jpeg', 0.8)
    
    wsManager.send({
      type: 'frame',
      image: base64Img
    })
    
  }, 1000)
}

const stopCapture = () => {
  if (captureTimer) {
     clearInterval(captureTimer)
     captureTimer = undefined
  }
}

const drawRealBoxes = (details: any[]) => {
  const canvas = boxCanvas.value
  if (!canvas) return
  
  if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
  }
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  if (mediaType.value !== 'camera') return 
  
  const video = videoRef.value
  if (!video || !video.videoWidth) return
  
  const scaleX = canvas.width / video.videoWidth
  const scaleY = canvas.height / video.videoHeight
  
  details.forEach(detail => {
    const behavior = detail.behaviorType
    // Dictionary check
    const negative = ['玩手机', '趴桌']
    const isNegative = negative.includes(behavior)
    
    const color = isNegative ? '#ef4444' : '#10b981'
    const rgbaBg = isNegative ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'
    
    if (detail.boundingBoxes && Array.isArray(detail.boundingBoxes)) {
      detail.boundingBoxes.forEach((box: number[]) => {
        const [x1, y1, x2, y2] = box
        const x = x1 * scaleX
        const y = y1 * scaleY
        const w = (x2 - x1) * scaleX
        const h = (y2 - y1) * scaleY
        
        ctx.fillStyle = rgbaBg
        ctx.fillRect(x, y, w, h)

        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, w, h)
        
        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif'
        const textWidth = ctx.measureText(behavior).width
        
        ctx.fillStyle = color
        ctx.fillRect(x, y - 28, textWidth + 16, 26)
        
        ctx.fillStyle = '#fff'
        ctx.fillText(behavior, x + 8, y - 9)
      })
    }
  })
}

const getBehaviorDotColor = (name: string) => {
  const negative = ['玩手机', '趴桌']
  const positive = ['举手回答问题', '起立回答问题']
  const normal = ['阅读', '书写', '正常听课']

  if (negative.includes(name)) return 'bg-red-500'
  if (positive.includes(name)) return 'bg-amber-400'
  if (normal.includes(name)) return 'bg-emerald-500'
  return 'bg-gray-400'
}

onUnmounted(() => {
  stopPolling()
  stopAnalysis()
  stopCamera()
})
</script>

<style scoped>
:deep(.el-upload-dragger) {
  background-color: rgba(31, 41, 55, 0.4);
  border-color: #4b5563;
  border-radius: 0.75rem;
  transition: all 0.3s;
}

:deep(.el-upload-dragger:hover) {
  background-color: rgba(31, 41, 55, 0.8);
  border-color: #3b82f6;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-video {
  width: 100%;
  height: auto;
  max-height: 100%;
}

.camera-video {
  max-width: 100%;
  max-height: 100%;
  /* 让视频完整显示不被裁剪，适应 16:9 展示区 */
  aspect-ratio: 16 / 9;
  object-fit: contain;
}
</style>
