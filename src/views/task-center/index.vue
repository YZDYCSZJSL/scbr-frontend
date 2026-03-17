<template>
  <div class="flex flex-col h-full gap-4">
    <!-- 顶栏 (类似参考图样式) -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center gap-4 shrink-0 overflow-x-auto whitespace-nowrap">
      <!-- 左侧：图标与标题 -->
      <div class="flex items-center gap-4 shrink-0">
        <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
          <el-icon :size="24"><Monitor /></el-icon>
        </div>
        <div class="flex flex-col">
          <span class="text-[17px] font-bold text-gray-800 tracking-wide">任务中心</span>
          <span class="text-[12px] text-gray-400 mt-1">管理及查看任务执行信息</span>
        </div>
      </div>

      <!-- 右侧：无标签内联搜索区 -->
      <div class="flex items-center gap-3 shrink-0">
        <el-input
          v-model="queryForm.keyword"
          placeholder="搜索课程 / 教师"
          clearable
          class="w-40"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="queryForm.status"
          placeholder="任务状态"
          clearable
          class="w-28"
        >
          <el-option label="排队中" :value="0" />
          <el-option label="分析中" :value="1" />
          <el-option label="分析成功" :value="2" />
          <el-option label="分析失败" :value="3" />
        </el-select>

        <el-select
          v-model="queryForm.mediaType"
          placeholder="媒体类型"
          clearable
          class="w-28"
        >
          <el-option label="图片" :value="1" />
          <el-option label="视频" :value="2" />
          <el-option label="实时流" :value="3" />
        </el-select>

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          range-separator="-"
          value-format="YYYY-MM-DD"
          class="!w-[230px]"
        />

        <el-button type="primary" color="#409eff" class="px-5 font-medium ml-1" @click="handleSearch">
          <el-icon class="mr-1"><Search /></el-icon>查询
        </el-button>
        <el-button class="px-4 font-medium" plain @click="handleReset">
          重置
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <!-- 列表标题与工具栏 -->
      <div class="flex justify-between items-center bg-gray-50/50 px-4 py-3 border-b border-gray-100 shrink-0">
        <div class="flex items-center space-x-2">
          <div class="w-1 h-4 bg-blue-500 rounded-full"></div>
          <span class="font-bold text-gray-700">分析任务执行台账</span>
        </div>
        <el-button plain size="small" @click="fetchList" class="text-gray-600 hover:text-blue-600">
          <el-icon class="mr-1"><RefreshRight /></el-icon>刷新状态
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        height="100%"
        stripe
        :header-cell-style="{ background: '#f8fafc', color: '#475569', fontWeight: 'bold' }"
      >
        <el-table-column prop="id" label="编号" width="80" align="center" />
        <el-table-column prop="courseName" label="课程名称" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-medium text-gray-800">{{ row.courseName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="教师" min-width="120">
          <template #default="{ row }">
            <div class="flex items-center space-x-2">
              <el-avatar :size="24" class="bg-indigo-100 text-indigo-700 text-xs shrink-0">
                {{ (row.teacherName || '无').charAt(0) }}
              </el-avatar>
              <span class="truncate">{{ row.teacherName || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="classroomName" label="教室" min-width="120" show-overflow-tooltip />

        <el-table-column label="媒体类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.mediaType === 1" type="info" effect="light" class="!border-none bg-gray-100" size="small">图片</el-tag>
            <el-tag v-else-if="row.mediaType === 2" type="primary" effect="light" class="!border-none bg-blue-50 text-blue-600" size="small">视频</el-tag>
            <el-tag v-else-if="row.mediaType === 3" type="warning" effect="light" class="!border-none bg-orange-50 text-orange-600" size="small">实时流</el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>

        <el-table-column label="任务状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="light" class="!border-none font-bold w-16 text-center" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="失败原因" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.status === 3" class="text-red-500 font-medium text-sm flex items-center gap-1">
              <el-icon><Warning /></el-icon> {{ formatFailReason(row.failReason) || '未知异常' }}
            </span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>

        <el-table-column label="耗时" width="90" align="center">
          <template #default="{ row }">
            <span class="text-gray-600 font-mono text-sm">{{ formatDuration(row.durationSeconds) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="评估结果" min-width="180">
  <template #default="{ row }">
    <div v-if="Number(row.status) === 2" class="flex flex-col text-sm leading-6">
      <span class="text-gray-700">
        综合评分：
        <span class="font-semibold text-gray-900">
          {{ row.totalScore ?? '-' }}
        </span>
      </span>
      <span class="text-gray-700">
        实到人数：
        <span class="font-semibold text-gray-900">
          {{ row.attendanceCount ?? '-' }}
        </span>
      </span>
      <span class="text-gray-700">
        等级：
        <span
          class="font-semibold"
          :class="
            Number(row.totalScore) >= 90
              ? 'text-green-600'
              : Number(row.totalScore) >= 80
                ? 'text-blue-600'
                : Number(row.totalScore) >= 70
                  ? 'text-yellow-600'
                  : 'text-red-600'
          "
        >
          {{
            Number(row.totalScore) >= 90
              ? '优秀'
              : Number(row.totalScore) >= 80
                ? '良好'
                : Number(row.totalScore) >= 70
                  ? '一般'
                  : '需关注'
          }}
        </span>
      </span>
    </div>

    <span v-else class="text-gray-400">-</span>
  </template>
</el-table-column>

        <el-table-column prop="createdAt" label="发现时间" width="160" align="center">
          <template #default="{ row }">
            <span class="text-gray-500 text-sm font-mono">{{ row.createdAt || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" width="220" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-3">
              <el-button type="primary" link size="small" class="!m-0 font-medium hover:text-blue-700" @click="openDetail(row)">
                <el-icon class="mr-1"><View /></el-icon> 详情日志
              </el-button>

             <el-button
                v-if="Number(row.status) === 2"
                type="success"
                link
                size="small"
                class="!m-0 font-medium hover:text-green-700"
                @click="goToReport(row)"
              >
                <el-icon class="mr-1"><DataAnalysis /></el-icon> 查看报告
              </el-button>

              <el-button
                v-if="Number(row.status) === 3"
                type="danger"
                link
                size="small"
                class="!m-0 font-medium hover:text-red-700"
                @click="handleRetry(row)"
              >
                <el-icon class="mr-1"><RefreshRight /></el-icon> 重试
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页器 -->
    <div class="mt-4 flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 shrink-0">
      <div class="text-sm text-gray-500 font-medium ml-2">总任务数：<span class="text-gray-900 font-bold">{{ total }}</span></div>
      <el-pagination
        background
        layout="sizes, prev, pager, next, jumper"
        :total="total"
        v-model:current-page="queryForm.page"
        v-model:page-size="queryForm.size"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <TaskDetailDrawer
      v-model="detailVisible"
      :task-id="currentTaskId"
      @refresh="fetchList"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, RefreshRight, View, DataAnalysis, Warning, Monitor } from '@element-plus/icons-vue'
import TaskDetailDrawer from './components/TaskDetailDrawer.vue'
import { getTaskCenterPage, retryTask } from './api'

const router = useRouter()

const loading = ref(false)
const total = ref(0)
const tableData = ref([])
const dateRange = ref([])
const detailVisible = ref(false)
const currentTaskId = ref(null)

const queryForm = ref({
  page: 1,
  size: 10,
  keyword: '',
  status: undefined,
  mediaType: undefined,
  startDate: '',
  endDate: ''
})

onMounted(() => {
  fetchList()
})

async function fetchList() {
  loading.value = true
  try {
    const params = {
      ...queryForm.value
    }

    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    } else {
      params.startDate = ''
      params.endDate = ''
    }

    const res = await getTaskCenterPage(params)

    tableData.value = res.records || res.list || []
    total.value = res.total || 0
    queryForm.value.page = res.current || queryForm.value.page
    queryForm.value.size = res.size || queryForm.value.size
  } catch (error) {
    console.error('获取任务中心列表失败：', error)
    ElMessage.error('获取任务中心列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryForm.value.page = 1
  fetchList()
}

function handleReset() {
  queryForm.value = {
    page: 1,
    size: 10,
    keyword: '',
    status: undefined,
    mediaType: undefined,
    startDate: '',
    endDate: ''
  }
  dateRange.value = []
  fetchList()
}

function handlePageChange(page) {
  queryForm.value.page = page
  fetchList()
}

function handleSizeChange(size) {
  queryForm.value.size = size
  queryForm.value.page = 1
  fetchList()
}

function openDetail(row) {
  currentTaskId.value = row.id
  detailVisible.value = true
  console.log('openDetail row =', row)
}

function goToReport(row) {
  router.push(`/history/${row.id}`)
}

async function handleRetry(row) {
  try {
    await ElMessageBox.confirm(
      `确认重新分析任务 ${row.id} 吗？`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消'
      }
    )

    await retryTask(row.id)
    ElMessage.success('任务已重新提交')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重试失败：', error)
    }
  }
}

function statusText(status) {
  const map = {
    0: '排队中',
    1: '分析中',
    2: '分析成功',
    3: '分析失败'
  }
  return map[status] || '未知'
}

function statusTagType(status) {
  const map = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger'
  }
  return map[status] || 'info'
}

function mediaTypeText(type) {
  const map = {
    1: '图片',
    2: '视频',
    3: '实时流'
  }
  return map[type] || '未知'
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || seconds === '') return '-'
  const totalSeconds = Number(seconds)
  if (Number.isNaN(totalSeconds)) return '-'
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const remainSeconds = totalSeconds % 60
  return `${minutes}分${remainSeconds}秒`
}

//显示时清洗
function formatFailReason(reason) {
  if (!reason) return '-'

  let text = String(reason)

  // 去掉 HTML 标签
  text = text.replace(/<[^>]+>/g, ' ')

  // 把多余空白压缩掉
  text = text.replace(/\s+/g, ' ').trim()

  // 如果包含典型 HTTP 错误，做友好化
  if (text.includes('404 Not Found')) {
    return '模型服务接口不存在（404）'
  }
  if (text.includes('500 Internal Server Error')) {
    return '模型服务内部异常（500）'
  }
  if (text.includes('Connection refused')) {
    return '无法连接模型服务'
  }
  if (text.includes('timed out')) {
    return '模型服务请求超时'
  }

  if (text.length > 80) {
    return text.slice(0, 80) + '...'
  }

  return text
}
</script>

<style scoped>
/* Scoped overrides to ensure clean rendering. Most styling is via Tailwind. */
:deep(.el-table__row) {
  transition: all 0.2s ease;
}
:deep(.el-table__row:hover) {
  background-color: #f1f5f9 !important;
}
</style>