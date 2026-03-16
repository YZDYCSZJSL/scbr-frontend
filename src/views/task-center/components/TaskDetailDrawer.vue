<template>
  <el-drawer
    :model-value="modelValue"
    title="任务详情"
    size="55%"
    destroy-on-close
    @close="handleClose"
  >
    <template v-if="loading">
      <div class="loading-wrap">
        <el-skeleton :rows="10" animated />
      </div>
    </template>

    <template v-else>
      <div class="task-detail-wrap">
        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-title">基础信息</div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="任务编号">
              {{ detail.id || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="statusTagType(detail.status)">
                {{ statusText(detail.status) }}
              </el-tag>
            </el-descriptions-item>

            <el-descriptions-item label="课程名称">
              {{ detail.courseName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="教师姓名">
              {{ detail.teacherName || '-' }}
            </el-descriptions-item>

            <el-descriptions-item label="教室名称">
              {{ detail.classroomName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="媒体类型">
              {{ mediaTypeText(detail.mediaType) }}
            </el-descriptions-item>

            <el-descriptions-item label="文件名称">
              {{ detail.fileName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ detail.createdAt || '-' }}
            </el-descriptions-item>

            <el-descriptions-item label="开始时间">
              {{ detail.startTime || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="结束时间">
              {{ detail.finishTime || '-' }}
            </el-descriptions-item>

            <el-descriptions-item label="执行耗时">
              {{ formatDuration(detail.durationSeconds) }}
            </el-descriptions-item>
            <el-descriptions-item label="重试次数">
              {{ detail.retryCount ?? 0 }}
            </el-descriptions-item>

            <el-descriptions-item label="失败原因" :span="2">
              <span class="fail-reason">{{ detail.failReason || '无' }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
        
        <el-card
          v-if="Number(detail.status) === 2"
          shadow="never"
          class="detail-card"
        >
          <template #header>
            <div class="card-title">结果摘要</div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="综合评分">
              {{ detail.totalScore ?? '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="实到人数">
              {{ detail.attendanceCount ?? '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-title">任务日志</div>
          </template>

          <TaskLogTimeline :logs="logs" />
        </el-card>
      </div>
    </template>

   <template #footer>
  <div class="drawer-footer">
    <el-button @click="handleClose">关闭</el-button>

    <el-button
      v-if="Number(detail.status) === 2"
      type="success"
      @click="goToReport"
    >
      查看报表
    </el-button>

    <el-button
      v-if="Number(detail.status) === 3"
      type="primary"
      :loading="retryLoading"
      @click="handleRetry"
    >
      重新分析
    </el-button>
  </div>
</template>
  </el-drawer>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import TaskLogTimeline from './TaskLogTimeline.vue'
import { getTaskCenterDetail, getTaskCenterLogs, retryTask } from '../api'

const router = useRouter()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  taskId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'refresh'])

const loading = ref(false)
const retryLoading = ref(false)
const detail = ref({})
const logs = ref([])

watch(
  () => [props.modelValue, props.taskId],
  async ([visible, taskId]) => {
    if (visible && taskId) {
      await loadData(taskId)
    }
  },
  { immediate: true }
)

async function loadData(taskId) {
  loading.value = true
  try {
    const [detailRes, logsRes] = await Promise.all([
      getTaskCenterDetail(taskId),
      getTaskCenterLogs(taskId)
    ])

    detail.value = detailRes || {}
    logs.value = Array.isArray(logsRes) ? logsRes : (logsRes?.records || [])
  } catch (error) {
    console.error('加载任务详情失败：', error)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  emit('update:modelValue', false)
}

async function handleRetry() {
  try {
    await ElMessageBox.confirm(
      '确认重新分析该失败任务吗？',
      '提示',
      {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消'
      }
    )

    retryLoading.value = true
    await retryTask(props.taskId)
    ElMessage.success('任务已重新提交')
    emit('refresh')
    await loadData(props.taskId)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重试任务失败：', error)
    }
  } finally {
    retryLoading.value = false
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
  const total = Number(seconds)
  if (Number.isNaN(total)) return '-'
  if (total < 60) return `${total} 秒`
  const min = Math.floor(total / 60)
  const sec = total % 60
  return `${min} 分 ${sec} 秒`
}

function goToReport() {
  router.push({
    path: '/history',
    query: {
      taskId: props.taskId
    }
  })
}
</script>

<style scoped>
.task-detail-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card {
  border-radius: 8px;
}

.card-title {
  font-weight: 600;
  color: #303133;
}

.loading-wrap {
  padding: 8px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.fail-reason {
  color: #f56c6c;
}
</style>