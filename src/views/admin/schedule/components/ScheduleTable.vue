<template>
  <el-table 
    v-loading="loading" 
    :data="tableData" 
    style="width: 100%" 
    height="100%"
    stripe
    :header-cell-style="{ background: '#f8fafc', color: '#475569', fontWeight: 'bold' }"
  >
    <el-table-column prop="courseName" label="排课课程" min-width="160" show-overflow-tooltip fixed>
      <template #default="{ row }">
        <span class="font-bold text-gray-800">{{ row.courseName }}</span>
      </template>
    </el-table-column>
    
    <el-table-column prop="teacherName" label="授课教师" width="120">
      <template #default="{ row }">
        <div class="flex items-center space-x-2">
          <el-avatar :size="24" class="bg-blue-100 text-blue-700 text-xs font-bold">{{ row.teacherName?.charAt(0) }}</el-avatar>
          <span class="font-medium text-gray-700">{{ row.teacherName }}</span>
        </div>
      </template>
    </el-table-column>
    
    <el-table-column prop="classroomName" label="上课地点" width="160" show-overflow-tooltip>
      <template #default="{ row }">
        <div class="flex items-center text-gray-600">
          <el-icon class="mr-1 text-orange-400"><Location /></el-icon>
          {{ row.classroomName }}
        </div>
      </template>
    </el-table-column>
    
    <el-table-column prop="studentCount" label="应到人数" width="100" align="center">
      <template #default="{ row }">
        <span class="text-gray-600 font-bold">{{ row.studentCount }} 人</span>
      </template>
    </el-table-column>

    <el-table-column label="星期" width="90" align="center">
      <template #default="{ row }">
        <span class="font-medium text-gray-700">{{ formatWeekday(row.weekday) }}</span>
      </template>
    </el-table-column>

    <el-table-column label="节次" width="110" align="center">
      <template #default="{ row }">
        <span class="text-gray-700 font-medium">
          第{{ row.startSectionNo }}-{{ row.endSectionNo }}节
        </span>
      </template>
    </el-table-column>

    <el-table-column label="时间段" width="160" align="center">
      <template #default="{ row }">
        <div class="flex items-center text-xs text-gray-500 justify-center bg-gray-50 px-2 py-1 rounded border border-gray-100 font-mono">
          <el-icon class="mr-1"><Clock /></el-icon>
          {{ row.startSectionTime }} <span class="mx-1 text-gray-300">~</span> {{ row.endSectionTime }}
        </div>
      </template>
    </el-table-column>

    <el-table-column label="周次" width="150" align="center">
      <template #default="{ row }">
        <span class="text-gray-700 font-medium">
          {{ row.startWeek }}-{{ row.endWeek }}周 / {{ formatWeekType(row.weekType) }}
        </span>
      </template>
    </el-table-column>

    <el-table-column label="操作" fixed="right" min-width="240" align="center">
      <template #default="scope">
        <div class="flex items-center justify-center gap-3">
          <el-button
            link
            type="success"
            size="small"
            class="!m-0 font-medium hover:text-green-700 transition-colors"
            @click="$emit('goAnalysis', scope.row)"
          >
            <el-icon class="mr-1"><DataAnalysis /></el-icon>去分析
          </el-button>

          <el-button
            link
            type="primary"
            size="small"
            class="!m-0 font-medium hover:text-blue-700 transition-colors"
            @click="$emit('edit', scope.row)"
          >
            <el-icon class="mr-1"><Edit /></el-icon>修改
          </el-button>

          <el-popconfirm
            title="确定要删除该排课计划吗？"
            confirm-button-text="确认删除"
            cancel-button-text="暂不"
            confirm-button-type="danger"
            width="240"
            icon="Warning"
            icon-color="#ef4444"
            @confirm="$emit('delete', scope.row)"
          >
            <template #reference>
              <el-button link type="danger" size="small" class="!m-0 font-medium hover:text-red-700 transition-colors">
                <el-icon class="mr-1"><Delete /></el-icon>删除
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { Location, Clock, DataAnalysis, Edit, Delete } from '@element-plus/icons-vue'

defineProps({
  loading: Boolean,
  tableData: Array
})

defineEmits(['goAnalysis', 'edit', 'delete'])

const formatWeekday = (weekday) => {
  const map = { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日' }
  return map[weekday] || '-'
}

const formatWeekType = (weekType) => {
  const map = { 0: '全周', 1: '单周', 2: '双周' }
  return map[weekType] || '-'
}
</script>
