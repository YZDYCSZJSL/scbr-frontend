<template>
  <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">趋势分析</h3>

    <div class="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-4 text-sm leading-7 text-indigo-800 mb-4">
      {{ trendSummaryText }}
    </div>

    <div v-if="trendData.length > 0" class="space-y-4">
      <!-- 折线图 -->
      <div
        ref="trendChartRef"
        class="w-full h-[320px] rounded-xl border border-gray-100 bg-white"
      ></div>

      <!-- 辅助列表 -->
      <div class="space-y-3 max-h-[280px] overflow-auto pr-1">
        <div
          v-for="(item, index) in trendDisplayRows"
          :key="index"
          class="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div class="text-gray-700">
              <span class="font-medium">时间点：</span>
              {{ item.frameTime }}
            </div>
            <div class="text-gray-700">
              <span class="font-medium">主要行为：</span>
              {{ item.behaviorText }}
            </div>
            <div class="text-gray-700">
              <span class="font-medium">总人数：</span>
              {{ item.totalCount }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-sm text-gray-500 min-h-[120px] flex items-center justify-center">
      暂无趋势分析数据
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  trendData: { type: Array, default: () => [] }
})

const trendChartRef = ref(null)
let trendChartInstance = null

const trendBehaviorKeys = computed(() => {
  const keySet = new Set()

  ;(props.trendData || []).forEach(item => {
    Object.keys(item || {}).forEach(key => {
      if (key !== 'frameTime' && key !== 'time') {
        keySet.add(key)
      }
    })
  })

  return Array.from(keySet)
})

const trendDisplayRows = computed(() => {
  return (props.trendData || []).map(item => {
    const frameTime = item.frameTime || item.time || '-'

    const behaviorEntries = Object.entries(item || {})
      .filter(([key]) => key !== 'frameTime' && key !== 'time')
      .map(([key, value]) => ({
        name: key,
        count: Number(value || 0)
      }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count)

    const totalCount = behaviorEntries.reduce((sum, cur) => sum + cur.count, 0)

    return {
      frameTime,
      behaviorText: behaviorEntries.length
        ? behaviorEntries.map(x => `${x.name}（${x.count}）`).join('、')
        : '-',
      totalCount
    }
  })
})

const trendSummaryText = computed(() => {
  if (!props.trendData.length) return '暂无趋势分析数据。'

  const latest = trendDisplayRows.value[trendDisplayRows.value.length - 1]
  const behaviorCount = trendBehaviorKeys.value.length

  return `当前共记录 ${props.trendData.length} 个趋势点，覆盖 ${behaviorCount} 类行为，最近一次趋势结果为：${latest?.behaviorText || '-'}。`
})

function renderTrendChart() {
  if (!trendChartRef.value) return
  if (!props.trendData.length) return

  if (!trendChartInstance) {
    trendChartInstance = echarts.init(trendChartRef.value)
  }

  const xAxisData = props.trendData.map(item => item.frameTime || item.time || '-')
  const behaviorKeys = trendBehaviorKeys.value

  const series = behaviorKeys.map(key => ({
    name: key,
    type: 'line',
    smooth: true,
    connectNulls: true,
    data: props.trendData.map(item => Number(item[key] ?? 0))
  }))

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      top: 0,
      data: behaviorKeys
    },
    grid: {
      left: 40,
      right: 20,
      top: 60,
      bottom: 30
    },
    xAxis: {
      type: 'category',
      data: xAxisData
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series
  }

  trendChartInstance.clear()
  trendChartInstance.setOption(option)
  trendChartInstance.resize()
}

const handleWindowResize = () => {
  if (trendChartInstance) {
    trendChartInstance.resize()
  }
}

watch(
  () => props.trendData,
  async (newVal) => {
    if (newVal && newVal.length > 0) {
      await nextTick()
      renderTrendChart()
    }
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
  if (trendChartInstance) {
    trendChartInstance.dispose()
    trendChartInstance = null
  }
})
</script>
