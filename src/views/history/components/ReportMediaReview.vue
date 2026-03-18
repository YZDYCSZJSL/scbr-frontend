<template>
  <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">媒体回看</h3>
      <div class="text-xs text-gray-400">用于回看原始媒体与识别框效果</div>
    </div>

    <div v-if="showMediaReview" class="space-y-4">
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

    <div
      v-else-if="isRealtimeMedia"
      class="rounded-xl bg-orange-50 border border-orange-100 px-4 py-4 text-sm text-orange-700"
    >
      当前任务为实时流分析，系统未保存完整原始视频，仅支持查看异常抓拍与趋势数据。
    </div>

    <div
      v-else
      class="text-sm text-gray-500 min-h-[120px] flex items-center justify-center"
    >
      暂无可回看的媒体文件
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  basicInfo: { type: Object, default: () => ({}) },
  mediaFileUrl: { type: String, default: '' },
  mediaDetailMapByFrame: { type: Object, default: () => ({}) },
  isFileMedia: { type: Boolean, default: false },
  isRealtimeMedia: { type: Boolean, default: false }
})

const showMediaReview = computed(() => {
  return props.isFileMedia && !!props.mediaFileUrl
})

const mediaImageRef = ref(null)
const mediaVideoRef = ref(null)
const mediaCanvasRef = ref(null)

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
  drawMediaBoxes(props.mediaDetailMapByFrame[0] || [], 'image')
}

const handleMediaVideoTimeUpdate = () => {
  const video = mediaVideoRef.value
  if (!video) return
  const currentSecond = Math.floor(video.currentTime || 0)
  const details = props.mediaDetailMapByFrame[currentSecond] || []
  drawMediaBoxes(details, 'video')
}
</script>
