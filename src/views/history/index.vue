<template>
  <div class="flex flex-col h-full gap-4 p-5">
    <!-- <el-alert
      title="本页面用于查看已分析完成的课堂结果、评分、行为统计与导出，不展示任务执行日志与失败重试。"
      type="success"
      :closable="false"
      show-icon
      class="page-tip shrink-0 mb-4"
    /> -->
    <!-- 顶栏 (类似参考图样式) -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-wrap justify-between items-center gap-4 shrink-0">
      <!-- 左侧：图标与标题 -->
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
          <el-icon :size="24"><Document /></el-icon>
        </div>
        <div class="flex flex-col">
          <span class="text-[17px] font-bold text-gray-800 tracking-wide">课堂行为评估报告</span>
          <span class="text-[12px] text-gray-400 mt-1">查看已完成识别的课堂评估结果、异常标记与报告入口</span>
        </div>
      </div>

      <!-- 右侧：无标签内联搜索区 -->
      <div class="flex flex-wrap items-center gap-3">
        <el-input
          v-model="searchQuery.keyword"
          placeholder="搜索课程名称或教师"
          clearable
          class="w-56"
          @keyup.enter="fetchData"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-date-picker
          v-model="searchQuery.dateRange"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-[240px]"
        />

        <el-button type="primary" class="px-5 font-medium ml-1" @click="fetchData">
          <el-icon class="mr-1"><Search /></el-icon>查询
        </el-button>
        <el-button class="px-5 font-medium" @click="handleReset">
          重置
        </el-button>

        <el-button
          type="success"
          class="px-5 font-medium"
          @click="handleBatchExport"
        >
          <el-icon class="mr-1"><Download /></el-icon>批量导出{{ selectedRows.length > 0 ? `(${selectedRows.length})` : '' }}
        </el-button>
      </div>
    </div>

    <!-- 报告概览卡片 -->
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
    <div
      v-for="item in reportOverviewCards"
      :key="item.label"
      class="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
    >
      <div class="text-sm text-gray-500 mb-2">{{ item.label }}</div>
      <div class="text-3xl font-bold text-gray-900">{{ item.value }}</div>
      <div class="text-xs text-gray-400 mt-2">{{ item.tip }}</div>
    </div>
  </div>

    <!-- 数据表格 -->
    <div class="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-0">
      <div class="flex justify-between items-center bg-gray-50/50 px-5 py-4 border-b border-gray-100 shrink-0">
        <div class="flex items-center space-x-2">
          <div class="w-1 h-4 bg-green-500 rounded-full"></div>
          <span class="font-bold text-gray-700">课堂评估报告台账</span>
        </div>
        <el-button plain size="small" @click="fetchData" class="text-gray-600 hover:text-green-600">
          <el-icon class="mr-1"><RefreshRight /></el-icon>刷新列表
        </el-button>
      </div>
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
              <el-avatar :size="24" class="bg-indigo-100 text-indigo-700 text-xs">{{ (row.teacherName || '无').charAt(0) }}</el-avatar>
              <span>{{ row.teacherName || '-' }}</span>
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
        <el-table-column prop="createdAt" label="分析时间" width="180" />

        <el-table-column label="综合评分" width="140" align="center">
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

        <el-table-column label="实到人数" width="110" align="center">
          <template #default="{ row }">
            <span class="font-semibold text-slate-700">
              {{ row.attendanceCount ?? '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="报告结论" min-width="220">
          <template #default="{ row }">
            <div class="text-sm leading-6">
              <div class="font-medium text-gray-800">
                {{ reportConclusionText(row) }}
              </div>
              <div class="text-[12px] text-gray-400 mt-1">
                出勤率：{{ row.attendanceRate != null ? `${row.attendanceRate}%` : '-' }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="课堂等级" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.reportLevel"
              :type="
                row.reportLevel === '优秀'
                  ? 'success'
                  : row.reportLevel === '良好'
                    ? 'primary'
                    : row.reportLevel === '一般'
                      ? 'warning'
                      : 'danger'
              "
              effect="light"
              class="!border-none"
              size="small"
            >
              {{ row.reportLevel }}
            </el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>

        <el-table-column label="异常状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="Number(row.abnormalFlag) === 1"
              type="danger"
              effect="light"
              class="!border-none"
              size="small"
            >
              有异常
            </el-tag>
            <el-tag
              v-else
              type="success"
              effect="light"
              class="!border-none"
              size="small"
            >
              正常
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" width="160" align="center">
          <template #default="scope">
            <div class="flex items-center justify-center gap-3">
              <el-button @click="showDetail(scope.row)" link type="primary" size="small" class="!m-0 font-medium hover:text-blue-700">
                <el-icon class="mr-1"><DataLine /></el-icon>查看评估报告
              </el-button>
              <el-button @click="handleExport(scope.row)" link type="success" size="small" class="!m-0 font-medium hover:text-green-700">
                <el-icon class="mr-1"><Download /></el-icon>导出报告
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页器 -->
      <div class="flex justify-between items-center bg-white px-5 py-4 border-t border-gray-100 shrink-0">
        <div class="text-sm text-gray-500 font-medium">总记录数：<span class="text-gray-900 font-bold">{{ total }}</span></div>
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
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted ,computed} from 'vue'
import { Search, Download, Document, DataLine, TopRight, BottomRight, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getReportPage, exportReportToExcel } from './api/index'
import { useRouter } from 'vue-router'


const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const selectedRows = ref([])

const searchQuery = reactive({
  keyword: '',
  dateRange: null,
  page: 1,
  size: 10
})

const reportOverviewCards = computed(() => {
  const list = tableData.value || []
  const count = list.length

  const avgScore =
    count > 0
      ? (
          list.reduce((sum, item) => sum + Number(item.totalScore || 0), 0) / count
        ).toFixed(1)
      : '-'

  const abnormalCount = list.filter(item => Number(item.abnormalFlag) === 1).length
  const goodCount = list.filter(item => ['优秀', '良好'].includes(item.reportLevel)).length

  return [
    {
      label: '当前页报告数',
      value: count,
      tip: '当前筛选结果中可查看的课堂报告数量'
    },
    {
      label: '平均评分',
      value: avgScore,
      tip: '当前页报告的综合评分均值'
    },
    {
      label: '异常课堂数',
      value: abnormalCount,
      tip: '存在异常标记的课堂数量'
    },
    {
      label: '优良课堂数',
      value: goodCount,
      tip: '等级为优秀或良好的课堂数量'
    }
  ]
})

function handleReset() {
  searchQuery.keyword = ''
  searchQuery.dateRange = null
  searchQuery.page = 1
  fetchData()
}

function reportConclusionText(row) {
  const level = row?.reportLevel
  const abnormal = Number(row?.abnormalFlag) === 1
  const attendanceRate = Number(row?.attendanceRate)

  if (abnormal && Number.isFinite(attendanceRate) && attendanceRate < 80) {
    return '课堂存在异常片段，且出勤率偏低，建议优先查看详情'
  }

  if (abnormal) {
    return '课堂识别到异常片段，建议重点查看趋势与抓拍内容'
  }

  if (level === '优秀') {
    return '课堂整体表现优良，识别结果较稳定'
  }

  if (level === '良好') {
    return '课堂整体状态良好，可进一步查看行为画像'
  }

  if (level === '一般') {
    return '课堂表现基本正常，建议结合详情页继续分析'
  }

  if (level) {
    return '课堂存在需关注内容，建议查看评估详情'
  }

  return '当前暂无明确评估结论'
}

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
    const rawList = res.records || []
    tableData.value = rawList.filter(item => Number(item.status) === 2)
    total.value = tableData.value.length

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
  router.push({
    name: 'HistoryDetail',
    params: { taskId: row.id }
  })
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

const handleBatchExport = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先在左侧勾选需要导出的单次记录')
    return
  }
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


<style scoped>
</style>