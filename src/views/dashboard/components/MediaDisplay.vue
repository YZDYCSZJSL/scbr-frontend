<template>
  <div class="flex-[2] bg-gray-950 rounded-xl overflow-hidden relative shadow-lg ring-1 ring-gray-900 border-gray-900 border flex flex-col">
    <div class="absolute inset-0 flex items-center justify-center">
        <template v-if="mediaType === 'local'">
          <div v-show="uploadedMediaUrl" class="relative group w-full h-full flex items-center justify-center bg-black">
            <img 
              v-if="uploadedMediaType === 'image'"
              ref="imageRef"
              :src="uploadedMediaUrl" 
              class="preview-image opacity-80 z-0"
              @load="handleImageLoad"
            />
          <video 
              v-else-if="uploadedMediaType === 'video'"
              ref="localVideoRef"
              :src="uploadedMediaUrl" 
              class="preview-video opacity-80 z-0"
              controls
              @timeupdate="handleVideoTimeUpdate"
          ></video>
            
            <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <el-button type="danger" circle size="large" @click="handleRemove" title="删除文件重新上传" class="shadow-lg !bg-black/50 hover:!bg-red-500/80 !border-none">
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
    
    <canvas ref="boxCanvas" class="absolute inset-0 w-full h-full z-10 pointer-events-none"></canvas>
    
    <div class="absolute top-4 left-4 z-20 flex space-x-3">
      <span class="px-4 py-1.5 bg-black/60 text-white rounded-lg text-sm backdrop-blur-md border border-gray-700/50 flex items-center font-medium shadow-lg">
        <span class="w-2.5 h-2.5 rounded-full mr-2.5" :class="isAnalyzing ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-red-500'"></span>
        {{ isAnalyzing ? '分析进行中' : '引擎待机' }}
      </span>
      <span class="px-3 py-1.5 bg-black/60 text-white rounded-lg text-sm backdrop-blur-md border border-gray-700/50 font-mono">
        FPS: <span :class="isAnalyzing ? 'text-green-400' : 'text-gray-400'">{{ isAnalyzing ? '29.97' : '0.00' }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Delete, UploadFilled } from '@element-plus/icons-vue'

const props = defineProps<{
  mediaType: 'camera' | 'local'
  isAnalyzing: boolean
  uploadedMediaUrl: string
  uploadedMediaType: 'image' | 'video' | ''
}>()

const emit = defineEmits<{
  (e: 'removeFile'): void
  (e: 'fileChange', file: any): void
  (e: 'imageLoad'): void
  (e: 'videoTimeUpdate'): void
}>()

const uploadRef = ref<any>(null)
const boxCanvas = ref<HTMLCanvasElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)
const localVideoRef = ref<HTMLVideoElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)

const handleRemove = () => emit('removeFile')
const handleFileChange = (file: any) => emit('fileChange', file)
const handleImageLoad = () => emit('imageLoad')
const handleVideoTimeUpdate = () => emit('videoTimeUpdate')

defineExpose({
  uploadRef,
  boxCanvas,
  imageRef,
  localVideoRef,
  videoRef
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
  aspect-ratio: 16 / 9;
  object-fit: contain;
}
</style>
