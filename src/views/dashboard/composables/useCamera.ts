import { ElMessage } from 'element-plus'
import type { Ref } from 'vue'

export function useCamera(mediaDisplayRef: Ref<any>) {
  let mediaStream: MediaStream | null = null

  const startCamera = async () => {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { aspectRatio: 16 / 9, facingMode: 'environment' }, 
        audio: false
      })
      const videoRef = mediaDisplayRef.value?.videoRef
      if (videoRef) {
        videoRef.srcObject = mediaStream
        videoRef.play().catch((e: Error) => console.error('视频流播放失败:', e))
      }
    } catch (error) {
      console.error('获取摄像头权限失败或无可用摄像头设备:', error)
      ElMessage.error('无法调用摄像头，请确认浏览器已授予摄像头权限且设备连接正常。')
    }
  }

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

  return { startCamera, stopCamera }
}
