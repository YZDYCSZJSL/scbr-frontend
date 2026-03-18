<template>
  <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">四维评分</h3>
    <div class="space-y-4">
      <div
        v-for="item in scoreCards"
        :key="item.label"
        class="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm text-gray-600">{{ item.label }}</span>
          <span class="text-lg font-semibold text-gray-900">{{ item.value }}</span>
        </div>
        <div class="text-xs text-gray-400">{{ item.desc }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatScore } from '../constants'

const props = defineProps({
  scores: { type: Object, default: () => ({}) }
})

const scoreCards = computed(() => [
  {
    label: '综合评分',
    value: formatScore(props.scores.totalScore),
    desc: '课堂整体状态评估'
  },
  {
    label: '出勤评分',
    value: formatScore(props.scores.attendanceScore),
    desc: '基于应到/实到人数计算'
  },
  {
    label: '专注度评分',
    value: formatScore(props.scores.focusScore),
    desc: '结合课堂正向行为与状态变化'
  },
  {
    label: '互动度评分',
    value: formatScore(props.scores.interactionScore),
    desc: '结合举手、站立等行为进行评估'
  },
  {
    label: '纪律评分',
    value: formatScore(props.scores.disciplineScore),
    desc: '结合异常行为和课堂秩序判断'
  }
])
</script>
