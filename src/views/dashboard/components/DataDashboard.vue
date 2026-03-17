<template>
  <div class="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col overflow-y-auto">
    <h3 class="font-bold text-lg text-gray-800 border-b pb-3 mb-4 flex items-center">
      <span class="p-1.5 bg-blue-100 text-blue-600 rounded-lg mr-2">
        <el-icon><DataAnalysis /></el-icon>
      </span>
      实时数据面板
    </h3>
    
    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-16 h-16 bg-blue-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
        <div class="text-sm text-blue-600 font-medium mb-1">实到人数</div>
        <div class="text-3xl font-black text-blue-800 flex items-end">
          {{ attendanceRate }}<span class="text-lg font-bold ml-1 text-blue-600">人</span>
        </div>
        <div class="text-xs text-blue-500/80 mt-2 font-medium">当前识别到场人数</div>
      </div>
      
      <div class="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-16 h-16 bg-emerald-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
        <div class="text-sm text-emerald-600 font-medium mb-1">班级专注度得分</div>
        <div class="text-3xl font-black text-emerald-800 flex items-end">
          {{ focusScore }}<span class="text-lg font-bold ml-1 text-emerald-600">分</span>
        </div>
        <div class="text-xs text-emerald-500/80 mt-2 font-medium">学习状态良好</div>
      </div>
    </div>

    <!-- 8 Behavior Statistics -->
    <div class="flex-1 flex flex-col">
      <h4 class="text-xs font-bold text-gray-500 mb-3 px-1 uppercase tracking-wider flex items-center justify-between">
        <span>行为分类识别分布</span>
        <span class="text-gray-400 font-normal">实时人数</span>
      </h4>
      <div class="space-y-2.5">
        <div v-for="(count, behavior) in behaviorData" :key="behavior" 
          class="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm transition-all group"
        >
          <div class="flex items-center">
            <span 
              class="w-2.5 h-2.5 rounded-full mr-3 shadow-sm ring-2 ring-white"
              :class="getBehaviorDotColor(behavior)"
            ></span>
            <span class="font-medium text-gray-700 group-hover:text-blue-900 transition-colors">{{ behavior }}</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden hidden xl:block">
              <div class="h-full rounded-full transition-all duration-500" 
                   :class="getBehaviorDotColor(behavior).replace('bg-','bg-')" 
                   :style="`width: ${Math.min((Number(count)/45)*100, 100)}%`">
              </div>
            </div>
            <span class="font-bold text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm w-16 text-center tabular-nums">
              {{ count }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DataAnalysis } from '@element-plus/icons-vue'

defineProps<{
  attendanceRate: number
  focusScore: number
  behaviorData: Record<string, number>
}>()

const getBehaviorDotColor = (name: string | number) => {
  const strName = String(name);
  const negative = ['玩手机', '趴桌']
  const positive = ['举手回答问题', '起立回答问题']
  const normal = ['阅读', '书写', '正常听课']

  if (negative.includes(strName)) return 'bg-red-500'
  if (positive.includes(strName)) return 'bg-amber-400'
  if (normal.includes(strName)) return 'bg-emerald-500'
  return 'bg-gray-400'
}
</script>
