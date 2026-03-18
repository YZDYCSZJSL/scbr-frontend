import type { Ref } from 'vue'

export function useDrawBoxes(mediaDisplayRef: Ref<any>) {
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

  return { drawBoxes }
}
