<template>
  <div class="search-bar">
    <div class="search-bar-left">
      <span class="page-title !text-lg text-gray-700">实时课堂分析</span>
      <!-- Schedule Selector -->
      <el-select 
        v-model="internalSelectedClass" 
        placeholder="请选择要分析的排课" 
        popper-class="!rounded-xl shadow-lg"
        class="w-80"
        @change="handleClassChange"
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
          <span class="font-bold text-gray-800 text-sm mb-1 truncate">
            {{ item.courseName }} - {{ item.classroomName }} - 讲师：{{ item.teacherName }}
          </span>
          <span class="text-xs text-gray-400">
            {{ formatWeekday(item.weekday) }} · 第{{ item.startSectionNo }}-{{ item.endSectionNo }}节
          </span>
          <span class="text-xs text-gray-400">
            {{ item.startSectionTime }} ~ {{ item.endSectionTime }} · {{ item.startWeek }}-{{ item.endWeek }}周 / {{ formatWeekType(item.weekType) }}
          </span>
        </div>
        </el-option>
      </el-select>
      
      <!-- Media Source Type Switch -->
      <el-radio-group v-model="internalMediaType" size="default" class="bg-gray-100 p-1 rounded-lg" @change="handleTypeChange">
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

    <div class="search-bar-right">
      <!-- Start Analysis Button -->
      <el-button 
        :type="isAnalyzing ? 'danger' : 'primary'" 
        size="large" 
        :loading="loadingToggle" 
        class="!font-bold !px-8 shadow-md rounded-lg transition-transform hover:scale-105"
        @click="$emit('toggleAnalysis')"
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
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Calendar, Camera, VideoCamera, VideoPause, VideoPlay } from '@element-plus/icons-vue'
import type { ScheduleAnalysisVO } from '../api'

const props = defineProps<{
  selectedClass: number | null
  mediaType: 'camera' | 'local'
  scheduleOptions: ScheduleAnalysisVO[]
  isAnalyzing: boolean
  loadingToggle: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedClass', val: number | null): void
  (e: 'update:mediaType', val: 'camera' | 'local'): void
  (e: 'toggleAnalysis'): void
}>()

const internalSelectedClass = ref(props.selectedClass)
const internalMediaType = ref(props.mediaType)

watch(() => props.selectedClass, (newVal) => {
  internalSelectedClass.value = newVal
})
watch(() => props.mediaType, (newVal) => {
  internalMediaType.value = newVal
})

const handleClassChange = (val: number | null) => {
  emit('update:selectedClass', val)
}

const handleTypeChange = (val: string | number | boolean) => {
  emit('update:mediaType', val as 'camera' | 'local')
}

// Utils
const formatWeekday = (weekday: number) => {
  const map: Record<number, string> = {
    1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日'
  }
  return map[weekday] || '-'
}

const formatWeekType = (weekType: number) => {
  const map: Record<number, string> = {
    0: '全周', 1: '单周', 2: '双周'
  }
  return map[weekType] || '-'
}
</script>
