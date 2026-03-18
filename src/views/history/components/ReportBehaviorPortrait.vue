<template>
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
    <!-- 行为画像 -->
    <div class="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">行为画像</h3>
        <div class="text-xs text-gray-400">基于当前识别明细自动汇总</div>
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        <el-tag
          v-for="item in topBehaviorList"
          :key="item.name"
          effect="light"
          round
        >
          {{ item.name }} · {{ item.count }}
        </el-tag>
      </div>

      <div class="text-sm leading-7 text-gray-700 rounded-xl bg-gray-50 px-4 py-4">
        {{ behaviorSummaryText }}
      </div>
    </div>

    <!-- 重点行为统计 -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">重点行为统计</h3>
      <div v-if="topBehaviorList.length > 0" class="space-y-3">
        <div
          v-for="item in topBehaviorList.slice(0, 5)"
          :key="item.name"
          class="rounded-lg border border-gray-100 px-4 py-3"
        >
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="text-gray-700 font-medium">{{ item.name }}</span>
            <span class="text-gray-900">{{ item.count }}</span>
          </div>
          <el-progress
            :percentage="item.ratio"
            :stroke-width="8"
            :show-text="false"
          />
        </div>
      </div>
      <div v-else class="text-sm text-gray-500 min-h-[120px] flex items-center justify-center">
        暂无行为统计数据
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  topBehaviorList: { type: Array, default: () => [] }
})

const behaviorSummaryText = computed(() => {
  if (!props.topBehaviorList.length) return '暂无可展示的行为画像数据。'

  const top3 = props.topBehaviorList
    .slice(0, 3)
    .map(item => `${item.name}（${item.count}）`)
    .join('、')

  return `当前课堂识别到的主要行为包括：${top3}。这一部分会在后续后端改造后进一步升级为“基于行为事实的报告摘要”，现在先以前端聚合结果展示课堂行为画像。`
})
</script>
