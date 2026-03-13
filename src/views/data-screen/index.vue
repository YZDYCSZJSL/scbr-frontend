<template>
  <div class="data-dashboard-container">
    <!-- 模块 1: 核心 KPI 卡片 -->
    <el-row :gutter="20" class="mb-4 kpi-row">
      <el-col :span="8" v-for="(kpi, index) in kpiData" :key="index">
        <el-card shadow="hover" class="kpi-card h-full">
          <div class="kpi-content flex flex-col justify-between h-full">
            <div class="kpi-label text-gray-500 text-base mb-2">{{ kpi.label }}</div>
            <div class="kpi-value-area flex items-baseline mt-2">
              <span class="kpi-value text-3xl font-bold text-gray-800">{{ kpi.value }}</span>
              <span class="kpi-unit text-sm text-gray-400 ml-1" v-if="kpi.unit">{{ kpi.unit }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表展示区域 -->
    <el-row :gutter="20" class="chart-row mb-4">
      <!-- 模块 2: 饼图/环形图 -->
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header font-bold text-gray-700">
              {{ dashboardData.pieTitle }}
            </div>
          </template>
          <div class="chart-container" ref="pieChartRef"></div>
        </el-card>
      </el-col>

      <!-- 模块 3: 横向排行柱状图 -->
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header font-bold text-gray-700">
              {{ dashboardData.barTitle }}
            </div>
          </template>
          <div class="chart-container" ref="barChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 模块 4: 底部折线图 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header font-bold text-gray-700">
              {{ dashboardData.lineTitle }}
            </div>
          </template>
          <div class="chart-container line-chart-container" ref="lineChartRef"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="DataDashboard">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getDashboardOverview } from './api/index'

// ============================================
// 一、真实接口数据状态
// ============================================
const dashboardData = ref({
  role: 0,
  userInfo: {
    empNo: '',
    name: '',
    role: 0,
    department: ''
  },
  kpi: [],
  pieTitle: '各行为占比画像',
  pie: [],
  barTitle: '',
  bar: [],
  lineTitle: '近七日课堂平均专注度趋势',
  lineDates: [],
  lineValues: []
})

const loading = ref(false)

const kpiData = computed(() => dashboardData.value.kpi || [])

// ============================================
// 二、ECharts DOM / 实例
// ============================================
const pieChartRef = ref(null)
const barChartRef = ref(null)
const lineChartRef = ref(null)

let chartInstances = {
  pie: null,
  bar: null,
  line: null
}

// ============================================
// 三、主题配色
// ============================================
const colorTheme = {
  primary: '#409EFF',
  success: '#67C23A',
  warning: '#E6A23C',
  danger: '#F56C6C',
  info: '#909399',
  lineGradStart: 'rgba(64, 158, 255, 0.4)',
  lineGradEnd: 'rgba(64, 158, 255, 0.05)',
  barGradStart: '#79bbff',
  barGradEnd: '#409EFF',
  textDefault: '#606266',
  lineSplit: '#EBEEF5'
}

// ============================================
// 四、初始化图表实例
// ============================================
const initCharts = () => {
  if (pieChartRef.value && !chartInstances.pie) {
    chartInstances.pie = echarts.init(pieChartRef.value)
  }
  if (barChartRef.value && !chartInstances.bar) {
    chartInstances.bar = echarts.init(barChartRef.value)
  }
  if (lineChartRef.value && !chartInstances.line) {
    chartInstances.line = echarts.init(lineChartRef.value)
  }
}

// ============================================
// 五、请求真实数据
// ============================================
const fetchDashboardData = async () => {
  loading.value = true
  try {
    const res = await getDashboardOverview({ days: 7 })

    dashboardData.value = {
      role: res.role ?? 0,
      userInfo: res.userInfo || {
        empNo: '',
        name: '',
        role: 0,
        department: ''
      },
      kpi: (res.kpi || []).map(item => ({
        label: item.label || '',
        value: Number(item.value ?? 0),
        unit: item.unit || ''
      })),
      pieTitle: res.pieTitle || '各行为占比画像',
      pie: (res.pie || []).map(item => ({
        name: item.name || '-',
        value: Number(item.value ?? 0)
      })),
      barTitle: res.barTitle || '',
      bar: (res.bar || []).map(item => ({
        name: item.name || '-',
        value: Number(item.value ?? 0)
      })),
      lineTitle: res.lineTitle || '近七日课堂平均专注度趋势',
      lineDates: res.lineDates || [],
      lineValues: (res.lineValues || []).map(v => Number(v ?? 0))
    }

    nextTick(() => {
      renderCharts()
    })
  } catch (error) {
    console.error('获取数据大屏数据失败', error)
    ElMessage.error('获取数据大屏数据失败')
  } finally {
    loading.value = false
  }
}

// ============================================
// 六、渲染图表
// ============================================
const renderCharts = () => {
  const data = dashboardData.value

  const safePieData = (data.pie || []).map(item => ({
    name: item.name || '-',
    value: Number(item.value ?? 0)
  }))

  const safeBarData = (data.bar || []).map(item => ({
    name: item.name || '-',
    value: Number(item.value ?? 0)
  }))

  const safeLineValues = (data.lineValues || []).map(v => Number(v ?? 0))

  // [1] 饼图
  if (chartInstances.pie) {
    chartInstances.pie.setOption({
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)'
      },
      legend: {
        bottom: '0%',
        left: 'center',
        textStyle: { color: colorTheme.textDefault }
      },
      color: [
        colorTheme.primary,
        colorTheme.success,
        colorTheme.warning,
        colorTheme.danger,
        colorTheme.info,
        '#8B5CF6',
        '#14B8A6'
      ],
      series: [
        {
          name: '行为占比',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false, position: 'center' },
          emphasis: {
            label: {
              show: true,
              fontSize: 18,
              fontWeight: 'bold',
              color: colorTheme.textDefault,
              formatter: '{b}\n{d}%'
            }
          },
          labelLine: { show: false },
          data: safePieData
        }
      ]
    })
  }

  // [2] 柱状图
  if (chartInstances.bar) {
   const barDataCopy = [...safeBarData].reverse()

    chartInstances.bar.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '10%',
        bottom: '5%',
        top: '5%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        max: 100,
        splitLine: {
          lineStyle: {
            color: colorTheme.lineSplit,
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: barDataCopy.map(d => d.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#DCDFE6' } },
        axisLabel: {
          color: colorTheme.textDefault,
          width: 120,
          overflow: 'truncate'
        }
      },
      series: [
        {
          name: '专注度分数',
          type: 'bar',
          barWidth: 20,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: colorTheme.barGradStart },
              { offset: 1, color: colorTheme.barGradEnd }
            ]),
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            color: colorTheme.primary,
            formatter: '{c}分',
            fontWeight: 600
          },
          data: barDataCopy.map(d => d.value)
        }
      ]
    })
  }

  // [3] 折线图
  if (chartInstances.line) {
    chartInstances.line.setOption({
      tooltip: { trigger: 'axis' },
      grid: {
        left: '2%',
        right: '3%',
        bottom: '5%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.lineDates || [],
        axisLine: { lineStyle: { color: '#DCDFE6' } },
        axisLabel: { color: colorTheme.textDefault }
      },
      yAxis: {
        type: 'value',
        max: 100,
        min: 0,
        splitLine: {
          lineStyle: {
            color: colorTheme.lineSplit,
            type: 'dashed'
          }
        },
        axisLabel: { color: colorTheme.textDefault }
      },
      series: [
        {
          name: '平均得分',
          type: 'line',
          smooth: true,
          symbolSize: 6,
          itemStyle: { color: colorTheme.primary },
          lineStyle: { width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: colorTheme.lineGradStart },
              { offset: 1, color: colorTheme.lineGradEnd }
            ])
          },
          data: safeLineValues
        }
      ]
    })
  }
}

// ============================================
// 七、窗口缩放自适应
// ============================================
const handleResize = () => {
  chartInstances.pie?.resize()
  chartInstances.bar?.resize()
  chartInstances.line?.resize()
}

// ============================================
// 八、生命周期
// ============================================
onMounted(() => {
  window.addEventListener('resize', handleResize)
  nextTick(async () => {
    initCharts()
    await fetchDashboardData()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(chartInstances).forEach(ins => {
    if (ins) ins.dispose()
  })
})
</script>

<style scoped>
.data-dashboard-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 84px);
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #333;
}

/* 覆盖 el-card 的部分内边距控制紧凑型 */
:deep(.el-card__body) {
  padding: 20px;
}
:deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.user-info {
  display: flex;
  align-items: center;
}
.greeting {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

/* Flex 工具模拟 */
.mb-4 { margin-bottom: 20px; }
.mr-3 { margin-right: 12px; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.text-sm { font-size: 14px; }
.text-base { font-size: 16px; }
.text-3xl { font-size: 28px; }
.font-bold { font-weight: bold; }
.text-gray-400 { color: #909399; }
.text-gray-500 { color: #606266; }
.text-gray-700 { color: #303133; }
.text-gray-800 { color: #1f2d3d; }
.h-full { height: 100%; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.justify-between { justify-content: space-between; }
.items-baseline { align-items: baseline; }

/* 图表容器统一高度管控 */
.chart-card {
  height: 380px;
  display: flex;
  flex-direction: column;
}
.chart-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100% - 55px);
  padding: 10px 20px 20px 20px;
}

.chart-container {
  flex: 1;
  width: 100%;
}
</style>