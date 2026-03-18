<template>
  <div class="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">课堂概览</h3>
      <el-tag v-if="scores.level || scores.reportLevel" type="success" effect="light">
        {{ scores.level || scores.reportLevel }}
      </el-tag>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div class="p-4 rounded-lg bg-gray-50">
        <div class="text-gray-500 mb-1">课程名称</div>
        <div class="text-gray-900 font-medium">{{ basicInfo.courseName || '-' }}</div>
      </div>
      <div class="p-4 rounded-lg bg-gray-50">
        <div class="text-gray-500 mb-1">上课时间</div>
        <div class="text-gray-900 font-medium">{{ basicInfo.classTimeText || '-' }}</div>
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
        <div class="text-gray-500 mb-1">媒体类型</div>
        <div class="text-gray-900 font-medium">{{ mediaTypeText }}</div>
      </div>
      <div class="p-4 rounded-lg bg-gray-50">
        <div class="text-gray-500 mb-1">分析时长</div>
        <div class="text-gray-900 font-medium">{{ durationText }}</div>
      </div>
    </div>

    <div class="mt-4 rounded-xl bg-blue-50 border border-blue-100 px-4 py-4">
      <div class="text-sm font-medium text-blue-900 mb-1">课堂状态解读</div>
      <div class="text-sm leading-7 text-blue-800">
        {{ classroomStatusText }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { toNumber } from '../constants'

const props = defineProps({
  basicInfo: { type: Object, default: () => ({}) },
  scores: { type: Object, default: () => ({}) },
  attendanceRate: { type: [String, Number], default: '-' }
})

const mediaTypeText = computed(() => {
  const mediaType = Number(props.basicInfo.mediaType)
  if (mediaType === 1) return '图片'
  if (mediaType === 2) return '视频文件'
  if (mediaType === 3) return '实时流'
  return '-'
})

const durationText = computed(() => {
  const durationSeconds = props.basicInfo.durationSeconds
  if (durationSeconds === undefined || durationSeconds === null) return '-'
  if (durationSeconds < 60) return `${durationSeconds} 秒`
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60
  return `${minutes} 分 ${seconds} 秒`
})

const classroomStatusText = computed(() => {
  const total = toNumber(props.scores.totalScore, 0)
  const rate = props.attendanceRate

  if (total >= 90) {
    return `本节课整体课堂状态较好，综合评分较高。${rate === '-' ? '' : `当前出勤率为 ${rate}% ，`}建议继续保持当前教学节奏，并重点观察课堂中后段的行为变化。`
  }
  if (total >= 75) {
    return `本节课整体表现较稳定，课堂秩序和参与情况基本正常。${rate === '-' ? '' : `当前出勤率为 ${rate}% ，`}可以进一步结合趋势区与异常抓拍区查看课堂波动。`
  }
  if (total > 0) {
    return `本节课综合表现还有提升空间。建议重点查看下方“趋势分析”和“异常抓拍”，从具体行为变化中定位课堂管理与互动改进点。`
  }
  return '当前报告中的综合评价数据仍不完整，可先结合行为画像、趋势与异常抓拍查看课堂情况。'
})
</script>
