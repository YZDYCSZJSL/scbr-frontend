<template>
  <div class="p-4 md:p-6 space-y-6">
    <!-- 顶部操作区 -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="text-sm text-gray-500 mb-1">课堂分析报告 / 详情</div>
        <h2 class="text-xl font-semibold text-gray-900">
          {{ basicInfo.courseName || '课堂评估报告详情' }}
        </h2>
        <div class="text-sm text-gray-500 mt-1">
          任务ID：{{ taskId || '-' }}
        </div>
      </div>

      <div class="flex items-center gap-3">
        <el-button @click="goBack">
          返回列表
        </el-button>
        <el-button type="primary" :loading="generateLoading" @click="handleGenerateReport">
          生成/刷新报告
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="bg-white rounded-xl border border-gray-100 shadow-sm p-10">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 页面内容 -->
    <template v-else>
      <!-- 基本信息 -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">课堂基本信息</h3>
          <el-tag v-if="scores.level || scores.reportLevel" type="success" effect="light">
            {{ scores.level || scores.reportLevel }}
          </el-tag>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">课程名称</div>
            <div class="text-gray-900 font-medium">{{ basicInfo.courseName || '-' }}</div>
          </div>
          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">教师姓名</div>
            <div class="text-gray-900 font-medium">{{ basicInfo.teacherName || '-' }}</div>
          </div>
          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">教室名称</div>
            <div class="text-gray-900 font-medium">{{ basicInfo.classroomName || '-' }}</div>
          </div>
          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">上课时间</div>
            <div class="text-gray-900 font-medium">{{ basicInfo.classTimeText || '-' }}</div>
          </div>

          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">应到人数</div>
            <div class="text-gray-900 font-medium">{{ basicInfo.studentCount ?? '-' }}</div>
          </div>
          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">实到人数</div>
            <div class="text-gray-900 font-medium">{{ basicInfo.attendanceCount ?? '-' }}</div>
          </div>
          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">媒体类型</div>
            <div class="text-gray-900 font-medium">{{ mediaTypeText }}</div>
          </div>
          <div class="p-4 rounded-lg bg-gray-50">
            <div class="text-gray-500 mb-1">分析时长</div>
            <div class="text-gray-900 font-medium">{{ durationText }}</div>
          </div>
        </div>
      </div>

      <!-- 分数区 -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="text-sm text-gray-500 mb-2">综合评分</div>
          <div class="text-3xl font-bold text-gray-900">{{ formatScore(scores.totalScore) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="text-sm text-gray-500 mb-2">出勤评分</div>
          <div class="text-3xl font-bold text-gray-900">{{ formatScore(scores.attendanceScore) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="text-sm text-gray-500 mb-2">专注度评分</div>
          <div class="text-3xl font-bold text-gray-900">{{ formatScore(scores.focusScore) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="text-sm text-gray-500 mb-2">互动度评分</div>
          <div class="text-3xl font-bold text-gray-900">{{ formatScore(scores.interactionScore) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="text-sm text-gray-500 mb-2">纪律评分</div>
          <div class="text-3xl font-bold text-gray-900">{{ formatScore(scores.disciplineScore) }}</div>
        </div>
      </div>

      <!-- 摘要和建议 -->
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

      <!-- 预留区域：后面再接趋势图和异常抓拍 -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
       <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
  <h3 class="text-lg font-semibold text-gray-900 mb-4">趋势分析</h3>

  <div v-if="trendData.length > 0" class="space-y-3">
    <div
      v-for="(item, index) in trendData"
      :key="index"
      class="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
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
    暂无趋势分析数据
  </div>
</div>
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">异常抓拍</h3>
    <div v-if="abnormalSnapshots.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div
      v-for="(item, index) in abnormalSnapshots"
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
      
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getReportEvaluation,
  getReportTrend,
  getReportAbnormalSnapshots,
  generateReport
} from './api/index'

const route = useRoute()
const router = useRouter()

const taskId = computed(() => route.params.taskId)

const loading = ref(false)
const generateLoading = ref(false)

const basicInfo = ref({})
const scores = ref({})
const summary = ref('')
const suggestions = ref([])

const trendData = ref([])
const abnormalSnapshots = ref([])

const mediaTypeText = computed(() => {
  const mediaType = Number(basicInfo.value.mediaType)
  if (mediaType === 1) return '图片'
  if (mediaType === 2) return '视频文件'
  if (mediaType === 3) return '实时流'
  return '-'
})

const durationText = computed(() => {
  const durationSeconds = basicInfo.value.durationSeconds
  if (durationSeconds === undefined || durationSeconds === null) return '-'
  if (durationSeconds < 60) return `${durationSeconds} 秒`
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60
  return `${minutes} 分 ${seconds} 秒`
})

const formatScore = (value) => {
  if (value === undefined || value === null || value === '') return '-'
  const num = Number(value)
  return Number.isFinite(num) ? num.toFixed(1) : '-'
}

const fetchEvaluation = async () => {
  if (!taskId.value) {
    ElMessage.error('缺少任务ID')
    return
  }
  try {
    const res = await getReportEvaluation(taskId.value)
    basicInfo.value = res.basicInfo || {}
    scores.value = res.scores || {}
    summary.value = res.summary || ''
    suggestions.value = Array.isArray(res.suggestions)
  ? res.suggestions
  : (res.suggestions ? [res.suggestions] : [])
  } catch (error) {
    console.error(error)
    ElMessage.error('获取课堂评估报告详情失败')
  }
}

const fetchTrend = async () => {
  if (!taskId.value) return

  try {
    const res = await getReportTrend(taskId.value)
    trendData.value = Array.isArray(res) ? res : (res?.trendData || [])
  } catch (error) {
    console.error(error)
    trendData.value = []
  }
}

const fetchAbnormalSnapshots = async () => {
  if (!taskId.value) return

  try {
    const res = await getReportAbnormalSnapshots(taskId.value)
    abnormalSnapshots.value = Array.isArray(res) ? res : (res?.records || res?.list || [])
  } catch (error) {
    console.error(error)
    abnormalSnapshots.value = []
  }
}


const handleGenerateReport = async () => {
  if (!taskId.value) {
    ElMessage.error('缺少任务ID')
    return
  }

  generateLoading.value = true
  try {
    await generateReport(taskId.value)
    ElMessage.success('报告生成成功')
    await fetchAllData()
  } catch (error) {
    console.error(error)
    ElMessage.error('生成报告失败')
  } finally {
    generateLoading.value = false
  }
}

const fetchAllData = async () => {
  if (!taskId.value) {
    ElMessage.error('缺少任务ID')
    return
  }

  loading.value = true
  try {
    await fetchEvaluation()
    await fetchTrend()
    await fetchAbnormalSnapshots()
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'History' })
}

watch(
  () => route.params.taskId,
  (newVal, oldVal) => {
    if (!newVal || newVal === oldVal) return
    fetchAllData()
  }
)


onMounted(() => {
  fetchAllData()
})
</script>