<template>
  <div class="flex flex-col gap-4 p-5">
    <!-- 顶部操作区 -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
      <div>
        <div class="text-sm text-gray-500 mb-1">课堂行为评估报告 / 详情</div>
        <h2 class="text-xl font-semibold text-gray-900">
          {{ basicInfo.courseName || '课堂行为评估报告详情' }}
        </h2>
        <div class="text-sm text-gray-500 mt-1 flex flex-wrap gap-4">
          <span>任务ID：{{ taskId || '-' }}</span>
          <span>教师：{{ basicInfo.teacherName || '-' }}</span>
          <span>教室：{{ basicInfo.classroomName || '-' }}</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <el-button @click="goBack">
          返回列表
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="bg-white rounded-xl border border-gray-100 shadow-sm p-10">
      <el-skeleton :rows="8" animated />
    </div>

    <template v-else>
      <!-- 课堂概览顶栏数据卡片 -->
      <ReportTopCards
        :basic-info="basicInfo"
        :scores="scores"
        :attendance-rate="attendanceRate"
        :abnormal-count="abnormalSnapshots.length"
        :top-behavior="topBehaviorList[0]"
      />

      <!-- 基本信息 + 四维评分 -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ReportClassroomOverview
          :basic-info="basicInfo"
          :scores="scores"
          :attendance-rate="attendanceRate"
        />
        <ReportScoreCards :scores="scores" />
      </div>

      <!-- 行为画像与重点行为统计 -->
      <ReportBehaviorPortrait :top-behavior-list="topBehaviorList" />

      <!-- 趋势分析 + 异常抓拍 -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ReportTrendAnalysis :trend-data="trendData" />
        <ReportAbnormalSnapshots :abnormal-snapshots="abnormalSnapshots" />
      </div>

      <!-- 媒体回看 -->
      <ReportMediaReview
        :basic-info="basicInfo"
        :media-file-url="mediaFileUrl"
        :media-detail-map-by-frame="mediaDetailMapByFrame"
        :is-file-media="isFileMedia"
        :is-realtime-media="isRealtimeMedia"
      />

      <!-- 摘要与建议 -->
      <ReportSummarySuggestions
        :summary="summary"
        :suggestions="suggestions"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReportData } from './composables/useReportData.js'

import ReportTopCards from './components/ReportTopCards.vue'
import ReportClassroomOverview from './components/ReportClassroomOverview.vue'
import ReportScoreCards from './components/ReportScoreCards.vue'
import ReportBehaviorPortrait from './components/ReportBehaviorPortrait.vue'
import ReportTrendAnalysis from './components/ReportTrendAnalysis.vue'
import ReportAbnormalSnapshots from './components/ReportAbnormalSnapshots.vue'
import ReportMediaReview from './components/ReportMediaReview.vue'
import ReportSummarySuggestions from './components/ReportSummarySuggestions.vue'

const route = useRoute()
const router = useRouter()

const taskId = computed(() => route.params.taskId)

const {
  loading,
  basicInfo,
  scores,
  summary,
  suggestions,
  trendData,
  abnormalSnapshots,
  mediaFileUrl,
  mediaDetailMapByFrame,
  isRealtimeMedia,
  isFileMedia,
  topBehaviorList,
  attendanceRate,
  fetchAllData
} = useReportData(taskId)

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