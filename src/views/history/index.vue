<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
    <!-- 顶栏搜索 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <el-icon :size="20"><Document /></el-icon>
        </div>
        <h2 class="text-xl font-bold text-gray-800">历史任务报表</h2>
      </div>
      <div class="flex space-x-3">
        <el-input 
          v-model="searchQuery.keyword" 
          placeholder="搜索课程名称或教师" 
          class="w-64 !h-10"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-date-picker
          v-model="searchQuery.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-72 !h-10"
        />
        <el-button type="primary" class="!h-10 px-6 font-medium" @click="fetchData">查询</el-button>
        <el-button 
          plain 
          class="!h-10 px-5 text-gray-600" 
          :disabled="selectedRows.length === 0"
          @click="handleBatchExport"
        >
          <el-icon class="mr-1"><Download /></el-icon>
          批量导出{{ selectedRows.length > 0 ? `${selectedRows.length}条记录`: '' }}
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="flex-1 overflow-hidden rounded-lg border border-gray-100">
      <el-table 
        v-loading="loading" 
        :data="tableData" 
        style="width: 100%" 
        height="100%"
        stripe
        :header-cell-style="{ background: '#f8fafc', color: '#475569', fontWeight: 'bold' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="courseName" label="课程" width="160" show-overflow-tooltip />
        <el-table-column prop="classroomName" label="教室" width="140" show-overflow-tooltip />
        <el-table-column label="教师" width="140">
          <template #default="{ row }">
            <div class="flex items-center space-x-2">
              <el-avatar :size="24" class="bg-indigo-100 text-indigo-700 text-xs">{{ row.teacherName.charAt(0) }}</el-avatar>
              <span>{{ row.teacherName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="媒体类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.mediaType === 1" type="info" effect="light" class="!border-none" size="small">图片</el-tag>
            <el-tag v-else-if="row.mediaType === 2" type="primary" effect="light" class="!border-none" size="small">视频</el-tag>
            <el-tag v-else-if="row.mediaType === 3" type="warning" effect="light" class="!border-none" size="small">实时流</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        
        <el-table-column label="分析状态" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 0" type="info" effect="light" class="!border-none" round>排队中</el-tag>
            <el-tag v-else-if="scope.row.status === 1" type="warning" effect="light" class="!border-none" round>分析中</el-tag>
            <el-tag v-else-if="scope.row.status === 2" type="success" effect="light" class="!border-none" round>分析成功</el-tag>
            <el-tag v-else-if="scope.row.status === 3" type="danger" effect="light" class="!border-none" round>分析失败</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="综合得分" width="140" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center space-x-2">
              <template v-if="row.status === 2">
                <span class="font-black text-lg" :class="row.totalScore >= 80 ? 'text-emerald-600' : (row.totalScore >= 60 ? 'text-amber-500' : 'text-red-500')">
                  {{ row.totalScore }}
                </span>
                <el-icon v-if="row.totalScore >= 80" class="text-emerald-500"><TopRight /></el-icon>
                <el-icon v-else-if="row.totalScore < 60" class="text-red-500"><BottomRight /></el-icon>
              </template>
              <template v-else>
                <span class="text-gray-400 font-bold">-</span>
              </template>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" width="160" align="center">
          <template #default="scope">
            <el-button @click="showDetail(scope.row)" link type="primary" size="small" class="font-medium hover:text-blue-700">
              <el-icon class="mr-1"><DataLine /></el-icon>详情
            </el-button>
            <el-button @click="handleExport(scope.row)" link type="success" size="small" class="font-medium hover:text-green-700">
              <el-icon class="mr-1"><Download /></el-icon>导出
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页器 -->
    <div class="mt-5 flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
      <div class="text-sm text-gray-500 font-medium ml-2">总记录数：<span class="text-gray-900 font-bold">{{ total }}</span></div>
      <el-pagination
        v-model:current-page="searchQuery.page"
        v-model:page-size="searchQuery.size"
        :page-sizes="[10, 20, 50]"
        layout="sizes, prev, pager, next, jumper"
        :total="total"
        background
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>
    <!-- 详情弹窗 -->
    <TaskDetail ref="taskDetailRef" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Download, Document, DataLine, TopRight, BottomRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import TaskDetail from './components/TaskDetail.vue'
import { getReportPage, exportReportToExcel } from './api/index'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const taskDetailRef = ref(null)
const selectedRows = ref([])

const searchQuery = reactive({
  keyword: '',
  dateRange: null,
  page: 1,
  size: 10
})

const fetchData = async () => {
  loading.value = true
  
  try {
    const params = {
      page: searchQuery.page,
      size: searchQuery.size
    }
    
    if (searchQuery.keyword) {
      params.keyword = searchQuery.keyword
    }
    
    if (searchQuery.dateRange && searchQuery.dateRange.length === 2) {
      const formatDate = (date) => {
        const d = new Date(date)
        const month = '' + (d.getMonth() + 1)
        const day = '' + d.getDate()
        const year = d.getFullYear()
        return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-')
      }
      params.startDate = formatDate(searchQuery.dateRange[0])
      params.endDate = formatDate(searchQuery.dateRange[1])
    }
    
    const res = await getReportPage(params)
    // request.js 响应拦截器已经返回了 res.data
    tableData.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error(error)
    ElMessage.error('请求异常')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const showDetail = (row) => {
  if (taskDetailRef.value) {
    taskDetailRef.value.open(row)
  }
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

const handleBatchExport = async () => {
  if (selectedRows.value.length === 0) return
  ElMessage.info('开始批量导出，请稍后...')
  try {
    const ids = selectedRows.value.map(r => r.id)
    await exportReportToExcel(ids)
    ElMessage.success('批量导出完成')
  } catch (error) {
    console.error(error)
    ElMessage.error('批量导出失败')
  }
}

const handleExport = async (row) => {
  ElMessage.info(`正在导出「${row.courseName}」报表...`)
  try {
    await exportReportToExcel([row.id])
    ElMessage.success('导出报表完成')
  } catch (error) {
    console.error(error)
    ElMessage.error('导出失败')
  }
}
</script>
