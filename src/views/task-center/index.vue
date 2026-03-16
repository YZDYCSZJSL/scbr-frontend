<template>
  <div class="task-center-page">
    <el-alert
      title="本页面用于查看分析任务的执行状态、失败原因、执行日志与重试；课堂结果请到“课堂分析报告”中查看。"
      type="info"
      :closable="false"
      show-icon
      class="page-tip"
    />
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="queryForm.keyword"
            placeholder="请输入课程/教师/教室关键词"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="任务状态">
          <el-select
            v-model="queryForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 160px"
          >
            <el-option label="排队中" :value="0" />
            <el-option label="分析中" :value="1" />
            <el-option label="分析成功" :value="2" />
            <el-option label="分析失败" :value="3" />
          </el-select>
        </el-form-item>

        <el-form-item label="媒体类型">
          <el-select
            v-model="queryForm.mediaType"
            placeholder="请选择媒体类型"
            clearable
            style="width: 160px"
          >
            <el-option label="图片" :value="1" />
            <el-option label="视频" :value="2" />
            <el-option label="实时流" :value="3" />
          </el-select>
        </el-form-item>

        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            range-separator="至"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="table-header">
          <span>分析任务列表(任务执行管理)</span>
          <el-button @click="fetchList">刷新</el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="任务编号" min-width="90" />
        <el-table-column prop="courseName" label="课程名称" min-width="160" />
        <el-table-column prop="teacherName" label="教师姓名" min-width="120" />
        <el-table-column prop="classroomName" label="教室名称" min-width="120" />

        <el-table-column label="媒体类型" min-width="100">
          <template #default="{ row }">
            {{ mediaTypeText(row.mediaType) }}
          </template>
        </el-table-column>

        <el-table-column label="任务状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>



        <el-table-column prop="retryCount" label="重试次数" min-width="90" />

        <el-table-column label="失败原因" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="fail-reason-text">{{ formatFailReason(row.failReason) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="执行耗时" min-width="100">
          <template #default="{ row }">
            {{ formatDuration(row.durationSeconds) }}
          </template>
        </el-table-column>


        <el-table-column prop="createdAt" label="创建时间" min-width="170" />
        <el-table-column prop="startTime" label="开始时间" min-width="170" />
        <el-table-column prop="finishTime" label="结束时间" min-width="170" />

     

        <el-table-column label="操作" fixed="right" min-width="220">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDetail(row)">
              详情
            </el-button>

            <el-button
              v-if="Number(row.status) === 2"
              type="success"
              link
              @click="goToReport(row)"
            >
              查看报表
            </el-button>

            <el-button
              v-if="Number(row.status) === 3"
              type="danger"
              link
              @click="handleRetry(row)"
            >
              重试
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :current-page="queryForm.page"
          :page-size="queryForm.size"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

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
  router.push({
    path: '/history',
    query: {
      taskId: row.id
    }
  })
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
.task-center-page {
  padding: 16px;
}

.search-card,
.table-card {
  border-radius: 10px;
  margin-bottom: 16px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.fail-reason-text {
  color: #f56c6c;
}

.page-tip {
  margin-bottom: 16px;
}
</style>