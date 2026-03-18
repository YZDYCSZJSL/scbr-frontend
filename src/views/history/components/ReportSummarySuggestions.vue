<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">课堂评估摘要</h3>
      <div class="text-sm leading-7 text-gray-700 min-h-[120px]">
        {{ summary || '暂无评估摘要' }}
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">教学建议</h3>
      <div v-if="suggestions.length > 0" class="space-y-3">
        <div
          v-for="(item, index) in suggestions"
          :key="index"
          class="text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-3"
        >
          {{ index + 1 }}. {{ item }}
        </div>
      </div>
      <div v-else class="text-sm text-gray-500">
        暂无建议
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  summary: { type: String, default: '' },
  suggestions: { type: Array, default: () => [] }
})
</script>
