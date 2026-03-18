<template>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
    <div
      v-for="card in overviewCards"
      :key="card.label"
      class="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
    >
      <div class="text-sm text-gray-500 mb-2">{{ card.label }}</div>
      <div class="text-3xl font-bold text-gray-900">{{ card.value }}</div>
      <div class="text-xs text-gray-400 mt-2">{{ card.tip }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatScore } from '../constants'

const props = defineProps({
  basicInfo: { type: Object, default: () => ({}) },
  scores: { type: Object, default: () => ({}) },
  attendanceRate: { type: [String, Number], default: '-' },
  abnormalCount: { type: Number, default: 0 },
  topBehavior: { type: Object, default: null }
})

const overviewCards = computed(() => [
  {
    label: '综合评分',
    value: formatScore(props.scores.totalScore),
    tip: props.scores.level || props.scores.reportLevel || '课堂综合表现'
  },
  {
    label: '出勤率',
    value: props.attendanceRate === '-' ? '-' : `${props.attendanceRate}%`,
    tip: `应到 ${props.basicInfo.studentCount ?? '-'} / 实到 ${props.basicInfo.attendanceCount ?? '-'}`
  },
  {
    label: '异常抓拍',
    value: props.abnormalCount,
    tip: props.abnormalCount > 0 ? '已识别异常片段' : '未发现明显异常'
  },
  {
    label: '主要行为',
    value: props.topBehavior?.name || '-',
    tip: props.topBehavior ? `累计 ${props.topBehavior.count}` : '暂无行为统计'
  }
])
</script>
