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

    <AnalysisReportSummary
      v-if="reportSummary.visible && mediaType === 'local'"
      :report-summary="reportSummary"
      :current-task-id="currentTaskId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

import TopControlBar from './components/TopControlBar.vue'
import MediaDisplay from './components/MediaDisplay.vue'
import DataDashboard from './components/DataDashboard.vue'
import AnalysisReportSummary from './components/AnalysisReportSummary.vue'

import { useCamera } from './composables/useCamera'
import { useSchedule } from './composables/useSchedule'
import { useDrawBoxes } from './composables/useDrawBoxes'
import { useAnalysis } from './composables/useAnalysis'

const selectedClass = ref<number | null>(null)
const mediaType = ref<'camera' | 'local'>('local')
const currentFile = ref<File | null>(null)
const uploadedMediaUrl = ref<string>('')
const uploadedMediaType = ref<'image' | 'video' | ''>('')

const mediaDisplayRef = ref<InstanceType<typeof MediaDisplay> | null>(null)
const detailMapByFrame = ref<Record<number, any[]>>({})

const { scheduleOptions, scheduleAnalysisInit, fetchScheduleList } = useSchedule(mediaType, selectedClass)

const { startCamera, stopCamera } = useCamera(mediaDisplayRef)

const { drawBoxes } = useDrawBoxes(mediaDisplayRef)

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

const {
  isAnalyzing,
  loadingToggle,
  currentTaskId,
  attendanceRate,
  focusScore,
  behaviorData,
  reportSummary,
  toggleAnalysis,
  stopAnalysis,
  stopPolling,
  resetReportSummary
} = useAnalysis({
  mediaType,
  selectedClass,
  scheduleOptions,
  currentFile,
  uploadedMediaType,
  mediaDisplayRef,
  detailMapByFrame,
  drawBoxes
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

watch(mediaType, async (newVal) => {
  await fetchScheduleList()
  if (newVal === 'camera') {
    if (uploadedMediaUrl.value) handleRemoveFile()
    setTimeout(() => {
      startCamera()
    }, 100)
  } else {
    stopCamera()
  }
})

onUnmounted(() => {
  stopPolling()
  stopAnalysis(true)
  stopCamera()
})
</script>
