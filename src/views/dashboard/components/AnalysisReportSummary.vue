<template>
  <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
      <div>
        <div class="text-sm text-gray-500 mb-1">本次课堂评估摘要</div>
        <h3 class="text-lg font-semibold text-gray-900">分析已完成，可查看完整课堂评估报告</h3>
      </div>

      <div class="flex items-center gap-3">
        <el-tag
          :type="
            reportSummary.reportLevel === '优秀'
              ? 'success'
              : reportSummary.reportLevel === '良好'
                ? 'primary'
                : reportSummary.reportLevel === '一般'
                  ? 'warning'
                  : 'danger'
          "
          effect="light"
        >
          {{ reportSummary.reportLevel || '未评级' }}
        </el-tag>

        <el-button type="primary" @click="goToReportDetail">
          查看完整报告
        </el-button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div class="rounded-xl bg-gray-50 border border-gray-100 p-4">
        <div class="text-sm text-gray-500 mb-2">综合评分</div>
        <div class="text-3xl font-bold text-gray-900">{{ reportSummary.totalScore || 0 }}</div>
      </div>

      <div class="rounded-xl bg-gray-50 border border-gray-100 p-4">
        <div class="text-sm text-gray-500 mb-2">实到人数</div>
        <div class="text-3xl font-bold text-gray-900">{{ reportSummary.attendanceCount || 0 }}</div>
      </div>

      <div class="rounded-xl bg-gray-50 border border-gray-100 p-4">
        <div class="text-sm text-gray-500 mb-2">出勤率</div>
        <div class="text-3xl font-bold text-gray-900">{{ reportSummary.attendanceRateText }}</div>
      </div>
    </div>

    <div class="rounded-xl bg-blue-50 border border-blue-100 px-4 py-4 text-sm text-gray-700 leading-7">
      {{ reportSummary.summaryText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const props = defineProps({
  reportSummary: { type: Object, required: true },
  currentTaskId: { type: [Number, null], default: null }
})

const router = useRouter()

const goToReportDetail = () => {
  if (!props.currentTaskId) {
    ElMessage.warning('当前任务暂无可跳转的报告')
    return
  }

  router.push({
    name: 'HistoryDetail',
    params: { taskId: props.currentTaskId }
  })
}
</script>
