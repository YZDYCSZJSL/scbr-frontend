<template>
  <div class="p-4 md:p-6 space-y-6">
    <!-- 顶部操作区 -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="text-sm text-gray-500 mb-1">课堂分析报告 / 详情</div>
        <h2 class="text-xl font-semibold text-gray-900">
          {{ basicInfo.courseName || '课堂评估报告详情' }}
        </h2>
        <div class="text-sm text-gray-500 mt-1">
          任务ID：{{ taskId || '-' }}
        </div>
      </div>

      <div class="flex items-center gap-3">
        <el-button @click="goBack">
          返回列表
        </el-button>
        <el-button type="primary" :loading="generateLoading" @click="handleGenerateReport">
          生成/刷新报告
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="bg-white rounded-xl border border-gray-100 shadow-sm p-10">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 页面内容 -->
    <template v-else>
      <!-- 基本信息 -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">课堂基本信息</h3>
          <el-tag v-if="scores.level || scores.reportLevel" type="success" effect="light">
            {{ scores.level || scores.reportLevel }}
          </el-tag>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">课程名称</div>
            <div class="text-gray-900 font-medium">{{ basicInfo.courseName || '-' }}</div>
          </div>
          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">教师姓名</div>
            <div class="text-gray-900 font-medium">{{ basicInfo.teacherName || '-' }}</div>
          </div>
          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">教室名称</div>
            <div class="text-gray-900 font-medium">{{ basicInfo.classroomName || '-' }}</div>
          </div>
          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">上课时间</div>
            <div class="text-gray-900 font-medium">{{ basicInfo.classTimeText || '-' }}</div>
          </div>

          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">应到人数</div>
            <div class="text-gray-900 font-medium">{{ basicInfo.studentCount ?? '-' }}</div>
          </div>
          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">实到人数</div>
            <div class="text-gray-900 font-medium">{{ basicInfo.attendanceCount ?? '-' }}</div>
          </div>
          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">媒体类型</div>
            <div class="text-gray-900 font-medium">{{ mediaTypeText }}</div>
          </div>
          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">分析时长</div>
            <div class="text-gray-900 font-medium">{{ durationText }}</div>
          </div>
        </div>
      </div>

      <!-- 媒体回看区 -->
<div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
  <h3 class="text-lg font-semibold text-gray-900 mb-4">媒体回看</h3>

  <!-- 文件流：图片/视频 -->
  <div v-if="showMediaReview" class="space-y-4">
    <!-- 图片 -->
    <div v-if="Number(basicInfo.mediaType) === 1" class="relative w-full rounded-xl overflow-hidden bg-black">
      <img
        ref="mediaImageRef"
        :src="mediaFileUrl"
        alt="课堂分析原图"
        class="w-full max-h-[520px] object-contain mx-auto block"
        @load="handleMediaImageLoad"
      />
      <canvas
        ref="mediaCanvasRef"
        class="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>

    <!-- 视频 -->
    <div v-else-if="Number(basicInfo.mediaType) === 2" class="relative w-full rounded-xl overflow-hidden bg-black">
      <video
        ref="mediaVideoRef"
        :src="mediaFileUrl"
        class="w-full max-h-[520px]"
        controls
        @timeupdate="handleMediaVideoTimeUpdate"
      />
      <canvas
        ref="mediaCanvasRef"
        class="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  </div>

  <!-- 实时流 -->
  <div
    v-else-if="isRealtimeMedia"
    class="rounded-xl bg-orange-50 border border-orange-100 px-4 py-4 text-sm text-orange-700"
  >
    当前任务为实时流分析，系统未保存完整原始视频，仅支持查看异常抓拍与趋势数据。
  </div>

  <!-- 无文件 -->
  <div
    v-else
    class="text-sm text-gray-500 min-h-[120px] flex items-center justify-center"
  >
    暂无可回看的媒体文件
  </div>
</div>

      <!-- 分数区 -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="text-sm text-gray-500 mb-2">综合评分</div>
          <div class="text-3xl font-bold text-gray-900">{{ formatScore(scores.totalScore) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="text-sm text-gray-500 mb-2">出勤评分</div>
          <div class="text-3xl font-bold text-gray-900">{{ formatScore(scores.attendanceScore) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="text-sm text-gray-500 mb-2">专注度评分</div>
          <div class="text-3xl font-bold text-gray-900">{{ formatScore(scores.focusScore) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="text-sm text-gray-500 mb-2">互动度评分</div>
          <div class="text-3xl font-bold text-gray-900">{{ formatScore(scores.interactionScore) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="text-sm text-gray-500 mb-2">纪律评分</div>
          <div class="text-3xl font-bold text-gray-900">{{ formatScore(scores.disciplineScore) }}</div>
        </div>
      </div>

      <!-- 摘要和建议 -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">课堂评估摘要</h3>
          <div class="text-sm leading-7 text-gray-700 min-h-[120px]">
            {{ summary || '暂无评估摘要' }}
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">教学建议</h3>
          <div v-if="suggestions.length > 0" class="space-y-3">
            <div
              v-for="(item, index) in suggestions"
              :key="index"
              class="text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-3"
            >
              {{ index + 1 }}. {{ item }}
            </div>
          </div>
          <div v-else class="text-sm text-gray-500">
            暂无建议
          </div>
        </div>
      </div>

      <!-- 预留区域：后面再接趋势图和异常抓拍 -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
       <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
  <h3 class="text-lg font-semibold text-gray-900 mb-4">趋势分析</h3>

  <div v-if="trendData.length > 0" class="space-y-3">
    <div
      v-for="(item, index) in trendData"
      :key="index"
      class="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div class="text-gray-700">
          <span class="font-medium">时间点：</span>
          {{ item.frameTime || item.time || '-' }}
        </div>
        <div class="text-gray-700">
          <span class="font-medium">行为：</span>
          {{ item.behaviorType || item.behaviorName || '-' }}
        </div>
        <div class="text-gray-700">
          <span class="font-medium">人数：</span>
          {{ item.count ?? '-' }}
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-sm text-gray-500 min-h-[120px] flex items-center justify-center">
    暂无趋势分析数据
  </div>
</div>
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">异常抓拍</h3>
    <div v-if="abnormalSnapshots.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div
      v-for="(item, index) in abnormalSnapshots"
      :key="index"
      class="rounded-xl border border-gray-100 overflow-hidden bg-gray-50"
    >
      <div class="aspect-video bg-gray-100 flex items-center justify-center">
        <img
          v-if="item.snapshotUrl || item.snapshot_url"
          :src="item.snapshotUrl || item.snapshot_url"
          alt="异常抓拍"
          class="w-full h-full object-cover"
        />
        <div v-else class="text-sm text-gray-400">
          暂无抓拍图片
        </div>
      </div>

      <div class="p-4 space-y-2 text-sm">
        <div class="text-gray-700">
          <span class="font-medium">时间点：</span>
          {{ item.frameTime || item.time || '-' }}
        </div>
        <div class="text-gray-700">
          <span class="font-medium">行为：</span>
          {{ item.behaviorType || item.behaviorName || '-' }}
        </div>
        <div class="text-gray-700">
          <span class="font-medium">人数：</span>
          {{ item.count ?? '-' }}
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-sm text-gray-500 min-h-[120px] flex items-center justify-center">
    暂无异常抓拍
  </div>
</div>
      
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getReportDetail,
  getReportEvaluation,
  getReportTrend,
  getReportAbnormalSnapshots,
  generateReport
} from './api/index'

const route = useRoute()
const router = useRouter()

const taskId = computed(() => route.params.taskId)

const loading = ref(false)
const generateLoading = ref(false)

const basicInfo = ref({})
const scores = ref({})
const summary = ref('')
const suggestions = ref([])

const trendData = ref([])
const abnormalSnapshots = ref([])

const mediaFileUrl = ref('')
const mediaDetailList = ref([])
const mediaDetailMapByFrame = ref({})
const mediaImageRef = ref(null)
const mediaVideoRef = ref(null)
const mediaCanvasRef = ref(null)

const mediaTypeText = computed(() => {
  const mediaType = Number(basicInfo.value.mediaType)
  if (mediaType === 1) return '图片'
  if (mediaType === 2) return '视频文件'
  if (mediaType === 3) return '实时流'
  return '-'
})

const durationText = computed(() => {
  const durationSeconds = basicInfo.value.durationSeconds
  if (durationSeconds === undefined || durationSeconds === null) return '-'
  if (durationSeconds < 60) return `${durationSeconds} 秒`
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60
  return `${minutes} 分 ${seconds} 秒`
})

const isFileMedia = computed(() => {
  const mediaType = Number(basicInfo.value.mediaType)
  return mediaType === 1 || mediaType === 2
})

const isRealtimeMedia = computed(() => {
  return Number(basicInfo.value.mediaType) === 3
})

const showMediaReview = computed(() => {
  return isFileMedia.value && !!mediaFileUrl.value
})

const formatScore = (value) => {
  if (value === undefined || value === null || value === '') return '-'
  const num = Number(value)
  return Number.isFinite(num) ? num.toFixed(1) : '-'
}

const fetchEvaluation = async () => {
  if (!taskId.value) {
    ElMessage.error('缺少任务ID')
    return
  }
  try {
    const res = await getReportEvaluation(taskId.value)
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
  if (!taskId.value) return

  try {
    const res = await getReportDetail(taskId.value)

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
  if (!taskId.value) return

  try {
    const res = await getReportTrend(taskId.value)
    trendData.value = Array.isArray(res) ? res : (res?.trendData || [])
  } catch (error) {
    console.error(error)
    trendData.value = []
  }
}

const fetchAbnormalSnapshots = async () => {
  if (!taskId.value) return

  try {
    const res = await getReportAbnormalSnapshots(taskId.value)
    abnormalSnapshots.value = Array.isArray(res) ? res : (res?.records || res?.list || [])
  } catch (error) {
    console.error(error)
    abnormalSnapshots.value = []
  }
}


const drawMediaBoxes = (details, sourceType) => {
  const canvas = mediaCanvasRef.value
  if (!canvas) return

  let sourceEl = null
  let sourceWidth = 0
  let sourceHeight = 0

  if (sourceType === 'image') {
    const img = mediaImageRef.value
    if (!img || !img.naturalWidth || !img.naturalHeight) return
    sourceEl = img
    sourceWidth = img.naturalWidth
    sourceHeight = img.naturalHeight
  }

  if (sourceType === 'video') {
    const video = mediaVideoRef.value
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

  ;(details || []).forEach((detail) => {
    const behavior = detail.behaviorType || ''
    const isNegative = ['玩手机', '趴桌'].includes(behavior)
    const color = isNegative ? '#ef4444' : '#10b981'
    const rgbaBg = isNegative ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)'

    if (Array.isArray(detail.boundingBoxes)) {
      detail.boundingBoxes.forEach((box) => {
        if (!Array.isArray(box) || box.length !== 4) return

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

const handleMediaImageLoad = () => {
  drawMediaBoxes(mediaDetailMapByFrame.value[0] || [], 'image')
}

const handleMediaVideoTimeUpdate = () => {
  const video = mediaVideoRef.value
  if (!video) return
  const currentSecond = Math.floor(video.currentTime || 0)
  const details = mediaDetailMapByFrame.value[currentSecond] || []
  drawMediaBoxes(details, 'video')
}


const handleGenerateReport = async () => {
  if (!taskId.value) {
    ElMessage.error('缺少任务ID')
    return
  }

  generateLoading.value = true
  try {
    await generateReport(taskId.value)
    ElMessage.success('报告生成成功')
    await fetchAllData()
  } catch (error) {
    console.error(error)
    ElMessage.error('生成报告失败')
  } finally {
    generateLoading.value = false
  }
}

const fetchAllData = async () => {
  if (!taskId.value) {
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

const goBack = () => {
  router.push({ name: 'History' })
}

watch(
  () => route.params.taskId,
  (newVal, oldVal) => {
    if (!newVal || newVal === oldVal) return
    fetchAllData()
  }
)


onMounted(() => {
  fetchAllData()
})
</script>