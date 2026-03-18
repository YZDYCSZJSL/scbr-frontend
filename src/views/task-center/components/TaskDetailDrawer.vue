<template>
  <el-drawer
    :model-value="modelValue"
    title="识别任务详情"
    size="55%"
    destroy-on-close
    class="custom-task-drawer"
    :header-style="{ marginBottom: '0', borderBottom: '1px solid #f3f4f6', paddingBottom: '16px', paddingTop: '20px', paddingLeft: '24px', paddingRight: '24px', fontWeight: 'bold' }"
    @close="handleClose"
  >
    <template v-if="loading">
      <div class="p-6">
        <el-skeleton :rows="8" animated />
      </div>
    </template>

    <template v-else>
      <div class="flex flex-col gap-4 p-6 bg-gray-50 min-h-full">
        <!-- 基础信息卡片 -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex-shrink-0">
          <div class="bg-gradient-to-r from-blue-50 to-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <span class="font-bold text-gray-700 flex items-center space-x-2">
              <el-icon class="text-blue-500"><InfoFilled /></el-icon>
              <span>任务基础信息</span>
            </span>
            <el-tag :type="statusTagType(detail.status)" effect="light" class="!border-none font-bold px-3 rounded-full">
              <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full" :class="statusDotClass(detail.status)"></div>
                {{ statusText(detail.status) }}
              </div>
            </el-tag>
          </div>
          <div class="p-4">
            <el-descriptions :column="2" border class="task-descriptions" size="small">
              <el-descriptions-item label="任务编号" label-class-name="w-28 bg-gray-50 text-gray-500 font-semibold">
                <span class="font-mono font-bold text-gray-700">{{ detail.id || '-' }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="媒体类型" label-class-name="w-28 bg-gray-50 text-gray-500 font-semibold">
                {{ mediaTypeText(detail.mediaType) }}
              </el-descriptions-item>

              <el-descriptions-item label="课程名称" label-class-name="bg-gray-50 text-gray-500 font-semibold">
                <span class="font-bold text-gray-800">{{ detail.courseName || '-' }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="教师姓名" label-class-name="bg-gray-50 text-gray-500 font-semibold">
                {{ detail.teacherName || '-' }}
              </el-descriptions-item>

              <el-descriptions-item label="教室名称" label-class-name="bg-gray-50 text-gray-500 font-semibold">
                {{ detail.classroomName || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="文件名称" label-class-name="bg-gray-50 text-gray-500 font-semibold">
                <span class="truncate block w-48 text-gray-600" :title="detail.fileName">{{ detail.fileName || '-' }}</span>
              </el-descriptions-item>

              <el-descriptions-item label="时间轨迹" :span="2" label-class-name="bg-gray-50 text-gray-500 font-semibold">
                <div class="flex items-center gap-6 text-sm text-gray-600">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-gray-400 text-[11px] text-center">创建记录</span>
                    <span class="font-mono font-semibold">{{ detail.createdAt || '-' }}</span>
                  </div>
                  <el-icon class="text-gray-300"><Right /></el-icon>
                  <div class="flex flex-col gap-0.5">
                    <span class="text-gray-400 text-[11px] text-center">开始分析</span>
                    <span class="font-mono font-semibold">{{ detail.startTime || '-' }}</span>
                  </div>
                  <el-icon class="text-gray-300"><Right /></el-icon>
                  <div class="flex flex-col gap-0.5">
                    <span class="text-gray-400 text-[11px] text-center">结束时间</span>
                    <span class="font-mono font-semibold">{{ detail.finishTime || '-' }}</span>
                  </div>
                </div>
              </el-descriptions-item>

              <el-descriptions-item label="执行耗时" label-class-name="bg-gray-50 text-gray-500 font-semibold">
                <span class="text-indigo-600 font-bold font-mono">{{ formatDuration(detail.durationSeconds) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="重试次数" label-class-name="bg-gray-50 text-gray-500 font-semibold">
                {{ detail.retryCount ?? 0 }} <span class="text-gray-400 text-xs font-normal">次</span>
              </el-descriptions-item>

              <el-descriptions-item v-if="Number(detail.status) === 3" label="失败原因" :span="2" label-class-name="bg-red-50 text-red-500 font-bold">
                <div class="bg-red-50 text-red-600 p-2.5 rounded-md text-sm border border-red-100 flex items-start gap-2 shadow-sm font-mono leading-relaxed">
                  <el-icon class="mt-0.5 shrink-0"><WarningFilled /></el-icon>
                  <span class="whitespace-pre-wrap">{{ detail.failReason || '未知系统异常' }}</span>
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
        
        <!-- 结果摘要 (仅成功时) -->
        <div
          v-if="Number(detail.status) === 2"
          class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-4 flex flex-col gap-4 flex-shrink-0"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-green-500/30">
                <el-icon :size="24"><Check /></el-icon>
              </div>
              <div>
                <div class="text-base font-bold text-gray-800">识别结果已生成</div>
                <div class="text-xs text-gray-400 mt-1">当前任务已完成识别，可进入评估报告查看趋势与异常抓拍</div>
              </div>
            </div>

            <el-button type="success" plain class="font-bold border-green-200" @click="goToReport">
              <el-icon class="mr-1"><DataAnalysis /></el-icon> 查看评估报告
            </el-button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
              <div class="text-xs text-gray-400 mb-1">综合评分</div>
              <div class="text-2xl font-black text-emerald-500 font-mono">{{ detail.totalScore ?? '-' }}</div>
            </div>

            <div class="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
              <div class="text-xs text-gray-400 mb-1">实到人数</div>
              <div class="text-2xl font-black text-indigo-500 font-mono">{{ detail.attendanceCount ?? '-' }}</div>
            </div>

            <div class="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
              <div class="text-xs text-gray-400 mb-1">识别耗时</div>
              <div class="text-2xl font-black text-blue-500 font-mono">{{ formatDuration(detail.durationSeconds) }}</div>
            </div>
          </div>

          <div class="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 leading-6">
            {{ successSummaryText }}
          </div>
        </div>


        <div
          v-if="Number(detail.status) === 3"
          class="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden p-4 flex flex-col gap-3 flex-shrink-0"
        >
          <div class="text-base font-bold text-red-600">任务执行失败</div>
          <div class="text-sm text-red-500 leading-6">
            当前任务未完成识别流程，建议先查看下方节点执行轨迹，再决定是否重新启动分析。
          </div>
          <div class="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 leading-6">
            {{ detail.failReason || '未知系统异常' }}
          </div>
        </div>

        <!-- 任务日志卡片 -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
          <div class="bg-gray-50 px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <span class="font-bold text-gray-700 flex items-center space-x-2">
              <el-icon class="text-indigo-500"><Document /></el-icon>
              <span>节点执行轨迹</span>
            </span>
          </div>
          <div class="p-5 overflow-y-auto flex-1 bg-slate-50/30">
            <TaskLogTimeline :logs="logs" />
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="px-5 py-3 border-t border-gray-100 flex justify-end gap-3 bg-white">
        <el-button class="font-bold px-6 text-gray-600 hover:text-gray-800 hover:bg-gray-100" @click="handleClose">关闭面板</el-button>

        <el-button
          v-if="Number(detail.status) === 3"
          type="primary"
          :loading="retryLoading"
          class="font-bold px-6 shadow-md shadow-blue-500/30"
          @click="handleRetry"
        >
          <el-icon class="mr-1"><RefreshRight /></el-icon>重新启动分析
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref, watch,computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled, Right, WarningFilled, Check, DataAnalysis, Document, RefreshRight } from '@element-plus/icons-vue'
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

const successSummaryText = computed(() => {
  const score = Number(detail.value?.totalScore)
  const attendance = detail.value?.attendanceCount ?? '-'

  if (!Number.isFinite(score)) {
    return '当前任务已完成识别处理，可进入评估报告页查看更详细的趋势与异常抓拍信息。'
  }

  if (score >= 90) {
    return `本次识别结果显示课堂整体状态较好，综合评分较高，当前实到人数为 ${attendance}。`
  }

  if (score >= 80) {
    return `本次识别结果显示课堂整体表现良好，建议进一步进入评估报告查看行为趋势变化。`
  }

  if (score >= 70) {
    return `本次识别结果显示课堂状态基本正常，但已有一定波动，建议查看异常抓拍与趋势分析。`
  }

  return `本次识别结果显示课堂存在需关注片段，建议尽快进入评估报告定位异常行为与时间段。`
})

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

function statusDotClass(status) {
  const map = {
    0: 'bg-gray-400',
    1: 'bg-orange-400',
    2: 'bg-green-500',
    3: 'bg-red-500'
  }
  return map[status] || 'bg-gray-400'
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
  router.push(`/history/${props.taskId}`)
}

</script>

<style scoped>
/* Scoped element plus overrides strictly for the drawer */
.custom-task-drawer :deep(.el-drawer__body) {
  padding: 0 !important;
}
.custom-task-drawer :deep(.el-drawer__header) {
  margin-bottom: 0px !important;
  color: #1e293b;
}
.task-descriptions :deep(.el-descriptions__content) {
  color: #334155;
}
</style>