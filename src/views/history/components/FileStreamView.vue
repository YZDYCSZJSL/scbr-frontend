<template>
  <div class="w-full h-full flex flex-col md:flex-row gap-5 overflow-hidden">
    <!-- 左侧区域：媒体展示 (flex: 3) -->
    <div class="flex-[3] flex flex-col h-full rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div class="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
        <span class="text-sm font-bold text-gray-700">媒体影像回放</span>
        <!-- FIX: 根据 media_type 动态映射并显示雷达图类型文案 -->
        <el-tag :type="taskData.mediaType === 1 ? 'info' : taskData.mediaType === 2 ? 'primary' : 'success'" size="small" effect="light" class="!border-none font-bold">
          {{ taskData.mediaType === 1 ? '图片' : taskData.mediaType === 2 ? '视频' : '实时流' }}
        </el-tag>
      </div>
      <div class="flex-1 bg-black flex items-center justify-center relative w-full h-full overflow-hidden">
  <!-- 图片展示 -->
  <img
    v-if="taskData.mediaType === 1 && taskData.fileUrl"
    ref="imageRef"
    :src="taskData.fileUrl"
    class="w-full h-full object-contain"
    @load="drawBoxes(detailMapByFrame[0] || [], 'image')"
  />

  <!-- 视频展示 -->
  <video
    v-else-if="taskData.mediaType === 2 && taskData.fileUrl"
    ref="localVideoRef"
    controls
    class="w-full h-full object-contain"
    :src="taskData.fileUrl"
    @timeupdate="handleLocalVideoTimeUpdate"
  >
    您的浏览器不支持 HTML5 视频播放该格式。
  </video>

  <!-- 无媒体占位 -->
  <div v-else class="flex flex-col items-center justify-center w-full h-full text-gray-500 bg-gray-900">
    <el-icon :size="32" class="mb-2"><Warning /></el-icon>
    <span class="text-sm">暂无媒体数据</span>
  </div>

  <!-- 画框层 -->
  <canvas
    ref="boxCanvas"
    class="absolute left-0 top-0 w-full h-full pointer-events-none"
  ></canvas>
</div>
    </div>

    <!-- 右侧区域：行为统计列表 (flex: 1) -->
    <div class="flex-1 flex flex-col h-full rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div class="p-3 border-b border-gray-100 bg-gray-50 shrink-0">
        <span class="text-sm font-bold text-gray-700">行为统计算法明细</span>
      </div>
      <div class="flex-1 overflow-x-auto p-4 custom-scrollbar">
        <el-table :data="taskData.behaviors" size="default" style="width: 100%" stripe border class="h-full rounded">
          <el-table-column prop="name" label="行为" min-width="80" align="center" />
          <el-table-column prop="count" label="人数" min-width="70" align="center">
            <template #default="{ row }">
              <span class="font-bold text-indigo-600">{{ row.count }}</span>
            </template>
          </el-table-column>
          <el-table-column label="占比" min-width="110" align="center">
            <template #default="{ row }">
              <el-progress 
                :percentage="taskData.attendanceCount > 0 ? Math.round((row.count / taskData.attendanceCount) * 100) : 0" 
                :format="p => p + '%'"
                :color="getBehaviorProgressColor(row.type)"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Loading, Picture, Warning } from '@element-plus/icons-vue'
import { ref, watch, nextTick } from 'vue'


const props = defineProps({
  taskData: {
    type: Object,
    required: true
  }
})
const imageRef = ref(null)
const localVideoRef = ref(null)
const boxCanvas = ref(null)
const detailMapByFrame = ref({})

// 按秒分组
const buildDetailMapByFrame = (details) => {
  const map = {}

  ;(details || []).forEach(item => {
    const frame = Number(item.frameTime || 0)
    if (!map[frame]) {
      map[frame] = []
    }
    map[frame].push(item)
  })

  detailMapByFrame.value = map
}

// 绘制框
const drawBoxes = (details, sourceType) => {
  const canvas = boxCanvas.value
  if (!canvas) return

  let sourceEl = null
  let sourceWidth = 0
  let sourceHeight = 0

  if (sourceType === 'image') {
    const img = imageRef.value
    if (!img || !img.naturalWidth || !img.naturalHeight) return
    sourceEl = img
    sourceWidth = img.naturalWidth
    sourceHeight = img.naturalHeight
  }

  if (sourceType === 'video') {
    const video = localVideoRef.value
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

  ;(details || []).forEach(detail => {
    const behavior = detail.behaviorType
    const negative = ['玩手机', '趴桌']
    const isNegative = negative.includes(behavior)

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

// 视频播放时的画框方法
const handleLocalVideoTimeUpdate = () => {
  if (!localVideoRef.value) return
  const currentSecond = Math.floor(localVideoRef.value.currentTime || 0)
  const details = detailMapByFrame.value[currentSecond] || []
  drawBoxes(details, 'video')
}

// 监听taskData.detailList
watch(
  () => props.taskData.detailList,
  (val) => {
    buildDetailMapByFrame(val || [])

    nextTick(() => {
      if (props.taskData.mediaType === 1) {
        drawBoxes(detailMapByFrame.value[0] || [], 'image')
      }
    })
  },
  { immediate: true, deep: true }
)

// 行为进度条颜色
const getBehaviorProgressColor = (type) => {
 const map = {
    '举手回答问题': '#3b82f6',
    '阅读': '#10b981',
    '趴桌': '#f59e0b',
    '起立回答问题': '#3b82f6',
    '玩手机': '#ef4444',
    '书写': '#10b981',
    '正常听课': '#10b981'
  }
  return map[type] || '#8b5cf6'
}
</script>
