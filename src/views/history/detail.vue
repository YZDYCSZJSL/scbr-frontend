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
      <!-- 课堂概览 -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div
          v-for="card in overviewCards"
          :key="card.label"
          class="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
        >
          <div class="text-sm text-gray-500 mb-2">{{ card.label }}</div>
          <div class="text-3xl font-bold text-gray-900">{{ card.value }}</div>
          <div class="text-xs text-gray-400 mt-2">{{ card.tip }}</div>
        </div>
      </div>

      <!-- 基本信息 + 四维评分 -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div class="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">课堂概览</h3>
            <el-tag v-if="scores.level || scores.reportLevel" type="success" effect="light">
              {{ scores.level || scores.reportLevel }}
            </el-tag>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="p-4 rounded-lg bg-gray-50">
              <div class="text-gray-500 mb-1">课程名称</div>
              <div class="text-gray-900 font-medium">{{ basicInfo.courseName || '-' }}</div>
            </div>
            <div class="p-4 rounded-lg bg-gray-50">
              <div class="text-gray-500 mb-1">上课时间</div>
              <div class="text-gray-900 font-medium">{{ basicInfo.classTimeText || '-' }}</div>
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
              <div class="text-gray-500 mb-1">媒体类型</div>
              <div class="text-gray-900 font-medium">{{ mediaTypeText }}</div>
            </div>
            <div class="p-4 rounded-lg bg-gray-50">
              <div class="text-gray-500 mb-1">分析时长</div>
              <div class="text-gray-900 font-medium">{{ durationText }}</div>
            </div>
          </div>

          <div class="mt-4 rounded-xl bg-blue-50 border border-blue-100 px-4 py-4">
            <div class="text-sm font-medium text-blue-900 mb-1">课堂状态解读</div>
            <div class="text-sm leading-7 text-blue-800">
              {{ classroomStatusText }}
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">四维评分</h3>
          <div class="space-y-4">
            <div
              v-for="item in scoreCards"
              :key="item.label"
              class="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-gray-600">{{ item.label }}</span>
                <span class="text-lg font-semibold text-gray-900">{{ item.value }}</span>
              </div>
              <div class="text-xs text-gray-400">{{ item.desc }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 行为画像 -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div class="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">行为画像</h3>
            <div class="text-xs text-gray-400">基于当前识别明细自动汇总</div>
          </div>

          <div class="flex flex-wrap gap-2 mb-4">
            <el-tag
              v-for="item in topBehaviorList"
              :key="item.name"
              effect="light"
              round
            >
              {{ item.name }} · {{ item.count }}
            </el-tag>
          </div>

          <div class="text-sm leading-7 text-gray-700 rounded-xl bg-gray-50 px-4 py-4">
            {{ behaviorSummaryText }}
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">重点行为统计</h3>
          <div v-if="topBehaviorList.length > 0" class="space-y-3">
            <div
              v-for="item in topBehaviorList.slice(0, 5)"
              :key="item.name"
              class="rounded-lg border border-gray-100 px-4 py-3"
            >
              <div class="flex items-center justify-between text-sm mb-2">
                <span class="text-gray-700 font-medium">{{ item.name }}</span>
                <span class="text-gray-900">{{ item.count }}</span>
              </div>
              <el-progress
                :percentage="item.ratio"
                :stroke-width="8"
                :show-text="false"
              />
            </div>
          </div>
          <div v-else class="text-sm text-gray-500 min-h-[120px] flex items-center justify-center">
            暂无行为统计数据
          </div>
        </div>
      </div>

      <!-- 趋势分析 + 异常抓拍 -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
       <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
  <h3 class="text-lg font-semibold text-gray-900 mb-4">趋势分析</h3>

  <div class="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-4 text-sm leading-7 text-indigo-800 mb-4">
    {{ trendSummaryText }}
  </div>

  <div v-if="trendData.length > 0" class="space-y-4">
    <!-- 折线图 -->
    <div
      ref="trendChartRef"
      class="w-full h-[320px] rounded-xl border border-gray-100 bg-white"
    ></div>

    <!-- 辅助列表 -->
    <div class="space-y-3 max-h-[280px] overflow-auto pr-1">
      <div
        v-for="(item, index) in trendDisplayRows"
        :key="index"
        class="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div class="text-gray-700">
            <span class="font-medium">时间点：</span>
            {{ item.frameTime }}
          </div>
          <div class="text-gray-700">
            <span class="font-medium">主要行为：</span>
            {{ item.behaviorText }}
          </div>
          <div class="text-gray-700">
            <span class="font-medium">总人数：</span>
            {{ item.totalCount }}
          </div>
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

          <div class="rounded-xl bg-orange-50 border border-orange-100 px-4 py-4 text-sm leading-7 text-orange-800 mb-4">
            {{ abnormalSummaryText }}
          </div>

          <div v-if="abnormalSnapshots.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="(item, index) in abnormalSnapshots.slice(0, 4)"
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

      <!-- 媒体回看 -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">媒体回看</h3>
          <div class="text-xs text-gray-400">用于回看原始媒体与识别框效果</div>
        </div>

        <div v-if="showMediaReview" class="space-y-4">
          <div v-if="Number(basicInfo.mediaType) === 1" class="relative w-full rounded-xl overflow-hidden bg-black">
            <img
              ref="mediaImageRef"
              :src="mediaFileUrl"
              alt="课堂分析原图"
              class="w-full max-h-[520px] object-contain mx-auto block"
              @load="handleMediaImageLoad"
            />
            <canvas
              ref="mediaCanvasRef"
              class="absolute inset-0 w-full h-full pointer-events-none"
            />
          </div>

          <div v-else-if="Number(basicInfo.mediaType) === 2" class="relative w-full rounded-xl overflow-hidden bg-black">
            <video
              ref="mediaVideoRef"
              :src="mediaFileUrl"
              class="w-full max-h-[520px]"
              controls
              @timeupdate="handleMediaVideoTimeUpdate"
            />
            <canvas
              ref="mediaCanvasRef"
              class="absolute inset-0 w-full h-full pointer-events-none"
            />
          </div>
        </div>

        <div
          v-else-if="isRealtimeMedia"
          class="rounded-xl bg-orange-50 border border-orange-100 px-4 py-4 text-sm text-orange-700"
        >
          当前任务为实时流分析，系统未保存完整原始视频，仅支持查看异常抓拍与趋势数据。
        </div>

        <div
          v-else
          class="text-sm text-gray-500 min-h-[120px] flex items-center justify-center"
        >
          暂无可回看的媒体文件
        </div>
      </div>

      <!-- 摘要与建议 -->
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
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch , nextTick, onBeforeUnmount} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import {
  getReportDetail,
  getReportEvaluation,
  getReportTrend,
  getReportAbnormalSnapshots
} from './api/index'

const route = useRoute()
const router = useRouter()

const taskId = computed(() => route.params.taskId)

const loading = ref(false)

const basicInfo = ref({})
const scores = ref({})
const summary = ref('')
const suggestions = ref([])

const trendData = ref([])
const abnormalSnapshots = ref([])

const trendChartRef = ref(null)
let trendChartInstance = null

const mediaFileUrl = ref('')
const mediaDetailList = ref([])
const mediaDetailMapByFrame = ref({})
const mediaImageRef = ref(null)
const mediaVideoRef = ref(null)
const mediaCanvasRef = ref(null)

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

const isFileMedia = computed(() => {
  const mediaType = Number(basicInfo.value.mediaType)
  return mediaType === 1 || mediaType === 2
})

const isRealtimeMedia = computed(() => {
  return Number(basicInfo.value.mediaType) === 3
})

const showMediaReview = computed(() => {
  return isFileMedia.value && !!mediaFileUrl.value
})


const toNumber = (value, defaultValue = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : defaultValue
}

const normalizeBehaviorName = (item) => {
  return item?.behaviorType || item?.behaviorName || '未识别行为'
}

const behaviorStatList = computed(() => {
  const map = {}

  ;(mediaDetailList.value || []).forEach((item) => {
    const name = normalizeBehaviorName(item)
    const count = toNumber(item.count, 1)
    map[name] = (map[name] || 0) + count
  })

  const total = Object.values(map).reduce((sum, val) => sum + val, 0)

  return Object.entries(map)
    .map(([name, count]) => ({
      name,
      count,
      ratio: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count)
})

const topBehaviorList = computed(() => behaviorStatList.value.slice(0, 6))

const attendanceRate = computed(() => {
  const shouldArrive = toNumber(basicInfo.value.studentCount, 0)
  const actualArrive = toNumber(basicInfo.value.attendanceCount, 0)
  if (!shouldArrive) return '-'
  return ((actualArrive / shouldArrive) * 100).toFixed(1)
})

const overviewCards = computed(() => [
  {
    label: '综合评分',
    value: formatScore(scores.value.totalScore),
    tip: scores.value.level || scores.value.reportLevel || '课堂综合表现'
  },
  {
    label: '出勤率',
    value: attendanceRate.value === '-' ? '-' : `${attendanceRate.value}%`,
    tip: `应到 ${basicInfo.value.studentCount ?? '-'} / 实到 ${basicInfo.value.attendanceCount ?? '-'}`
  },
  {
    label: '异常抓拍',
    value: abnormalSnapshots.value.length,
    tip: abnormalSnapshots.value.length > 0 ? '已识别异常片段' : '未发现明显异常'
  },
  {
    label: '主要行为',
    value: topBehaviorList.value[0]?.name || '-',
    tip: topBehaviorList.value[0] ? `累计 ${topBehaviorList.value[0].count}` : '暂无行为统计'
  }
])

const scoreCards = computed(() => [
  {
    label: '综合评分',
    value: formatScore(scores.value.totalScore),
    desc: '课堂整体状态评估'
  },
  {
    label: '出勤评分',
    value: formatScore(scores.value.attendanceScore),
    desc: '基于应到/实到人数计算'
  },
  {
    label: '专注度评分',
    value: formatScore(scores.value.focusScore),
    desc: '结合课堂正向行为与状态变化'
  },
  {
    label: '互动度评分',
    value: formatScore(scores.value.interactionScore),
    desc: '结合举手、站立等行为进行评估'
  },
  {
    label: '纪律评分',
    value: formatScore(scores.value.disciplineScore),
    desc: '结合异常行为和课堂秩序判断'
  }
])

const classroomStatusText = computed(() => {
  const total = toNumber(scores.value.totalScore, 0)
  const rate = attendanceRate.value

  if (total >= 90) {
    return `本节课整体课堂状态较好，综合评分较高。${rate === '-' ? '' : `当前出勤率为 ${rate}% ，`}建议继续保持当前教学节奏，并重点观察课堂中后段的行为变化。`
  }
  if (total >= 75) {
    return `本节课整体表现较稳定，课堂秩序和参与情况基本正常。${rate === '-' ? '' : `当前出勤率为 ${rate}% ，`}可以进一步结合趋势区与异常抓拍区查看课堂波动。`
  }
  if (total > 0) {
    return `本节课综合表现还有提升空间。建议重点查看下方“趋势分析”和“异常抓拍”，从具体行为变化中定位课堂管理与互动改进点。`
  }
  return '当前报告中的综合评价数据仍不完整，可先结合行为画像、趋势与异常抓拍查看课堂情况。'
})

const behaviorSummaryText = computed(() => {
  if (!topBehaviorList.value.length) return '暂无可展示的行为画像数据。'

  const top3 = topBehaviorList.value
    .slice(0, 3)
    .map(item => `${item.name}（${item.count}）`)
    .join('、')

  return `当前课堂识别到的主要行为包括：${top3}。这一部分会在后续后端改造后进一步升级为“基于行为事实的报告摘要”，现在先以前端聚合结果展示课堂行为画像。`
})

const trendBehaviorKeys = computed(() => {
  const keySet = new Set()

  ;(trendData.value || []).forEach(item => {
    Object.keys(item || {}).forEach(key => {
      if (key !== 'frameTime' && key !== 'time') {
        keySet.add(key)
      }
    })
  })

  return Array.from(keySet)
})

const trendDisplayRows = computed(() => {
  return (trendData.value || []).map(item => {
    const frameTime = item.frameTime || item.time || '-'

    const behaviorEntries = Object.entries(item || {})
      .filter(([key]) => key !== 'frameTime' && key !== 'time')
      .map(([key, value]) => ({
        name: key,
        count: Number(value || 0)
      }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count)

    const totalCount = behaviorEntries.reduce((sum, cur) => sum + cur.count, 0)

    return {
      frameTime,
      behaviorText: behaviorEntries.length
        ? behaviorEntries.map(x => `${x.name}（${x.count}）`).join('、')
        : '-',
      totalCount
    }
  })
})

const trendSummaryText = computed(() => {
  if (!trendData.value.length) return '暂无趋势分析数据。'

  const latest = trendDisplayRows.value[trendDisplayRows.value.length - 1]
  const behaviorCount = trendBehaviorKeys.value.length

  return `当前共记录 ${trendData.value.length} 个趋势点，覆盖 ${behaviorCount} 类行为，最近一次趋势结果为：${latest?.behaviorText || '-'}。`
})

const abnormalSummaryText = computed(() => {
  if (!abnormalSnapshots.value.length) return '当前未检测到明显异常抓拍。'

  const firstItem = abnormalSnapshots.value[0] || {}
  const firstBehavior = firstItem.behaviorType || firstItem.behaviorName || '异常行为'

  return `当前共识别到 ${abnormalSnapshots.value.length} 条异常抓拍记录，其中优先建议关注“${firstBehavior}”相关片段。`
})


function renderTrendChart() {
  if (!trendChartRef.value) return
  if (!trendData.value.length) return

  if (!trendChartInstance) {
    trendChartInstance = echarts.init(trendChartRef.value)
  }

  const xAxisData = trendData.value.map(item => item.frameTime || item.time || '-')
  const behaviorKeys = trendBehaviorKeys.value

  const series = behaviorKeys.map(key => ({
    name: key,
    type: 'line',
    smooth: true,
    connectNulls: true,
    data: trendData.value.map(item => Number(item[key] ?? 0))
  }))

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      top: 0,
      data: behaviorKeys
    },
    grid: {
      left: 40,
      right: 20,
      top: 60,
      bottom: 30
    },
    xAxis: {
      type: 'category',
      data: xAxisData
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series
  }

  trendChartInstance.clear()
  trendChartInstance.setOption(option)
  trendChartInstance.resize()
}

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

const buildMediaDetailMapByFrame = (details) => {
  const map = {}
  ;(details || []).forEach((item) => {
    const frame = Number(item.frameTime || 0)
    if (!map[frame]) map[frame] = []
    map[frame].push(item)
  })
  mediaDetailMapByFrame.value = map
}

const fetchMediaReviewData = async () => {
  if (!taskId.value) return

  try {
    const res = await getReportDetail(taskId.value)

    // 1. 媒体文件和明细
    mediaFileUrl.value = res.fileUrl || ''
    mediaDetailList.value = Array.isArray(res.detailList) ? res.detailList : []
    buildMediaDetailMapByFrame(mediaDetailList.value)

    // 2. 用旧 detail 接口兜底回填基本信息
    basicInfo.value = {
      ...basicInfo.value,
      courseName: basicInfo.value.courseName || res.courseName || '',
      teacherName: basicInfo.value.teacherName || res.teacherName || '',
      classroomName: basicInfo.value.classroomName || res.classroomName || '',
      mediaType: basicInfo.value.mediaType ?? res.mediaType,
      attendanceCount: basicInfo.value.attendanceCount ?? res.attendanceCount
    }

    // 3. 如果 evaluation 没给分数，用旧 detail 的 totalScore 兜底
    scores.value = {
      ...scores.value,
      totalScore: scores.value.totalScore ?? res.totalScore
    }
  } catch (error) {
    console.error(error)
    mediaFileUrl.value = ''
    mediaDetailList.value = []
    mediaDetailMapByFrame.value = {}
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


const drawMediaBoxes = (details, sourceType) => {
  const canvas = mediaCanvasRef.value
  if (!canvas) return

  let sourceEl = null
  let sourceWidth = 0
  let sourceHeight = 0

  if (sourceType === 'image') {
    const img = mediaImageRef.value
    if (!img || !img.naturalWidth || !img.naturalHeight) return
    sourceEl = img
    sourceWidth = img.naturalWidth
    sourceHeight = img.naturalHeight
  }

  if (sourceType === 'video') {
    const video = mediaVideoRef.value
    if (!video || !video.videoWidth || !video.videoHeight) return
    sourceEl = video
    sourceWidth = video.videoWidth
    sourceHeight = video.videoHeight
  }

  if (!sourceEl) return

  if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const canvasRect = canvas.getBoundingClientRect()
  const mediaRect = sourceEl.getBoundingClientRect()

  const scaleX = mediaRect.width / sourceWidth
  const scaleY = mediaRect.height / sourceHeight
  const offsetX = mediaRect.left - canvasRect.left
  const offsetY = mediaRect.top - canvasRect.top

  ;(details || []).forEach((detail) => {
    const behavior = detail.behaviorType || ''
    const isNegative = ['玩手机', '趴桌'].includes(behavior)
    const color = isNegative ? '#ef4444' : '#10b981'
    const rgbaBg = isNegative ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)'

    if (Array.isArray(detail.boundingBoxes)) {
      detail.boundingBoxes.forEach((box) => {
        if (!Array.isArray(box) || box.length !== 4) return

        const [x1, y1, x2, y2] = box
        const x = offsetX + x1 * scaleX
        const y = offsetY + y1 * scaleY
        const w = (x2 - x1) * scaleX
        const h = (y2 - y1) * scaleY

        ctx.fillStyle = rgbaBg
        ctx.fillRect(x, y, w, h)
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, w, h)

        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif'
        const textWidth = ctx.measureText(behavior).width
        const labelY = y - 28 < 0 ? y : y - 28

        ctx.fillStyle = color
        ctx.fillRect(x, labelY, textWidth + 16, 26)
        ctx.fillStyle = '#fff'
        ctx.fillText(behavior, x + 8, labelY + 18)
      })
    }
  })
}

const handleMediaImageLoad = () => {
  drawMediaBoxes(mediaDetailMapByFrame.value[0] || [], 'image')
}

const handleMediaVideoTimeUpdate = () => {
  const video = mediaVideoRef.value
  if (!video) return
  const currentSecond = Math.floor(video.currentTime || 0)
  const details = mediaDetailMapByFrame.value[currentSecond] || []
  drawMediaBoxes(details, 'video')
}



const fetchAllData = async () => {
  if (!taskId.value) {
    ElMessage.error('缺少任务ID')
    return
  }

  loading.value = true
  try {
    await fetchEvaluation()
    await fetchMediaReviewData()
    await fetchTrend()
    await fetchAbnormalSnapshots()
  } finally {
    loading.value = false
    await nextTick()
    if (trendData.value.length > 0) {
      renderTrendChart()
    }
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

const handleWindowResize = () => {
  if (trendChartInstance) {
    trendChartInstance.resize()
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
  if (trendChartInstance) {
    trendChartInstance.dispose()
    trendChartInstance = null
  }
})

onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
  fetchAllData()
})
</script>