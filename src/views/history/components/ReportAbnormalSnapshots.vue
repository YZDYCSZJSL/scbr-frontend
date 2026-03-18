<template>
  <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">异常抓拍</h3>

    <div class="rounded-xl bg-orange-50 border border-orange-100 px-4 py-4 text-sm leading-7 text-orange-800 mb-4">
      {{ abnormalSummaryText }}
    </div>

    <div v-if="abnormalSnapshots.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="(item, index) in abnormalSnapshots.slice(0, 4)"
        :key="index"
        class="rounded-xl border border-gray-100 overflow-hidden bg-gray-50"
      >
        <div class="aspect-video bg-gray-100 flex items-center justify-center">
          <img
            v-if="item.snapshotUrl || item.snapshot_url"
            :src="item.snapshotUrl || item.snapshot_url"
            alt="异常抓拍"
            class="w-full h-full object-cover"
          />
          <div v-else class="text-sm text-gray-400">
            暂无抓拍图片
          </div>
        </div>

        <div class="p-4 space-y-2 text-sm">
          <div class="text-gray-700">
            <span class="font-medium">时间点：</span>
            {{ item.frameTime || item.time || '-' }}
          </div>
          <div class="text-gray-700">
            <span class="font-medium">行为：</span>
            {{ item.behaviorType || item.behaviorName || '-' }}
          </div>
          <div class="text-gray-700">
            <span class="font-medium">人数：</span>
            {{ item.count ?? '-' }}
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-sm text-gray-500 min-h-[120px] flex items-center justify-center">
      暂无异常抓拍
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  abnormalSnapshots: { type: Array, default: () => [] }
})

const abnormalSummaryText = computed(() => {
  if (!props.abnormalSnapshots.length) return '当前未检测到明显异常抓拍。'

  const firstItem = props.abnormalSnapshots[0] || {}
  const firstBehavior = firstItem.behaviorType || firstItem.behaviorName || '异常行为'

  return `当前共识别到 ${props.abnormalSnapshots.length} 条异常抓拍记录，其中优先建议关注“${firstBehavior}”相关片段。`
})
</script>
