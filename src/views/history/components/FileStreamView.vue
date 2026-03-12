<template>
  <div class="w-full h-full flex flex-col md:flex-row gap-5 overflow-hidden">
    <!-- 左侧区域：媒体展示 (flex: 3) -->
    <div class="flex-[3] flex flex-col h-full rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div class="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
        <span class="text-sm font-bold text-gray-700">媒体影像回放</span>
        <!-- FIX: 根据 media_type 动态映射并显示雷达图类型文案 -->
        <el-tag :type="taskData.mediaType === 1 ? 'info' : taskData.mediaType === 2 ? 'primary' : 'success'" size="small" effect="light" class="!border-none font-bold">
          {{ taskData.mediaType === 1 ? '图片' : taskData.mediaType === 2 ? '视频' : '实时流' }}
        </el-tag>
      </div>
      <div class="flex-1 bg-black flex items-center justify-center relative w-full h-full overflow-hidden">
        <!-- FIX: 根据 media_type 判断，如果是图片类型(1)，加入条件渲染逻辑展示对应图片 -->
        <!-- 图片展示 -->
        <el-image
          v-if="taskData.mediaType === 1 && taskData.fileUrl"
          :src="taskData.fileUrl"
          :preview-src-list="[taskData.fileUrl]"
          fit="contain"
          class="w-full h-full object-contain"
          lazy
        >
          <template #placeholder>
            <div class="flex flex-col items-center justify-center w-full h-full text-gray-400 bg-gray-900">
              <el-icon class="is-loading mb-2" :size="24"><Loading /></el-icon>
              <span class="text-xs">加载中...</span>
            </div>
          </template>
          <template #error>
            <div class="flex flex-col items-center justify-center w-full h-full text-gray-400 bg-gray-900">
              <el-icon :size="32" class="mb-2"><Picture /></el-icon>
              <span class="text-sm">加载失败或无图片</span>
            </div>
          </template>
        </el-image>

        <!-- 视频/流展示 -->
        <video
          v-else-if="(taskData.mediaType === 2 || taskData.mediaType === 3) && taskData.fileUrl"
          controls
          class="w-full h-full object-contain"
          :src="taskData.fileUrl"
        >
          您的浏览器不支持 HTML5 视频播放该格式。
        </video>
        
        <!-- 无媒体占位 -->
        <div v-else class="flex flex-col items-center justify-center w-full h-full text-gray-500 bg-gray-900">
          <el-icon :size="32" class="mb-2"><Warning /></el-icon>
          <span class="text-sm">暂无媒体数据</span>
        </div>
      </div>
    </div>

    <!-- 右侧区域：行为统计列表 (flex: 1) -->
    <div class="flex-1 flex flex-col h-full rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div class="p-3 border-b border-gray-100 bg-gray-50 shrink-0">
        <span class="text-sm font-bold text-gray-700">行为统计算法明细</span>
      </div>
      <div class="flex-1 overflow-x-auto p-4 custom-scrollbar">
        <el-table :data="taskData.behaviors" size="default" style="width: 100%" stripe border class="h-full rounded">
          <el-table-column prop="name" label="行为" min-width="80" align="center" />
          <el-table-column prop="count" label="人数" min-width="70" align="center">
            <template #default="{ row }">
              <span class="font-bold text-indigo-600">{{ row.count }}</span>
            </template>
          </el-table-column>
          <el-table-column label="占比" min-width="110" align="center">
            <template #default="{ row }">
              <el-progress 
                :percentage="taskData.attendanceCount > 0 ? Math.round((row.count / taskData.attendanceCount) * 100) : 0" 
                :format="p => p + '%'"
                :color="getBehaviorProgressColor(row.type)"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Loading, Picture, Warning } from '@element-plus/icons-vue'

const props = defineProps({
  taskData: {
    type: Object,
    required: true
  }
})

// 行为进度条颜色
const getBehaviorProgressColor = (type) => {
  const map = {
    listening: '#10b981',     // emerald-500
    playing_phone: '#ef4444', // red-500
    sleeping: '#f59e0b',      // amber-500
    raising_hand: '#3b82f6',  // blue-500
    // FIX: 兼容数据库或后端直接传来的中文 behavior_type
    '正常听课': '#10b981',
    '认真听讲': '#10b981',
    '玩手机': '#ef4444',
    '玩弄手机': '#ef4444',
    '趴桌': '#f59e0b',
    '趴桌睡觉': '#f59e0b',
    '举手互动': '#3b82f6'
  }
  return map[type] || '#8b5cf6'
}
</script>
