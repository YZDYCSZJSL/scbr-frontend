<template>
  <div class="data-dashboard-container">
    <!-- 调试用角色切换器 (接入真实接口时可删除此模块) -->
    <div class="dashboard-header mb-4 flex justify-end">
      <el-radio-group v-model="currentUser.role" @change="handleRoleChange" size="small">
        <el-radio-button :label="1">管理员视角</el-radio-button>
        <el-radio-button :label="0">普通教师视角</el-radio-button>
      </el-radio-group>
    </div>

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

    <!-- 图表展示区域: 1-1 上下布局 或 左右分栏 flex 布局 -->
    <el-row :gutter="20" class="chart-row mb-4">
      <!-- 模块 2: 饼图/环形图 -->
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header font-bold text-gray-700">
              各行为占比画像
            </div>
          </template>
          <div class="chart-container" ref="pieChartRef"></div>
        </el-card>
      </el-col>

      <!-- 模块 4: 横向排行柱状图 -->
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header font-bold text-gray-700">
              {{ currentUser.role === 1 ? '全校各学院专注度排行 Top 5' : '我的班级专注度排行' }}
            </div>
          </template>
          <div class="chart-container" ref="barChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 模块 3: 底部折线图 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header font-bold text-gray-700">
              近七日课堂专注度趋势
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
import * as echarts from 'echarts'

// ============================================
// 一、 模拟全局状态：当前登录用户信息
// ============================================
// role: 1 代表超级管理员, 0 代表普通老师
const currentUser = ref({
  emp_no: 'T001',
  name: '张老师',
  role: 0 
})

// 角色切换事件处理 (接入真实接口后可删除)
const handleRoleChange = () => {
  nextTick(() => {
    // 重新渲染图表数据
    renderCharts()
  })
}


// ============================================
// 二、 Mock 数据工厂
// ============================================
// 根据提取自原数据库业务梳理提取的假数据
const mockDataStore = {
  // role: 1 超级管理员数据
  ADMIN: {
    kpi: [
      { label: '全校累计排课数', value: 12560, unit: '节' },
      { label: '全校累计分析人次', value: 345890, unit: '次' },
      { label: '全校平均专注度得分', value: 87.5, unit: '分' }
    ],
    // 对应 analysis_detail 分类
    pie: [
      { name: '认真听讲', value: 65000 },
      { name: '举手互动', value: 15000 },
      { name: '低头玩手机', value: 8000 },
      { name: '趴桌睡觉', value: 5000 },
      { name: '发呆/左顾右盼', value: 7000 }
    ],
    line: [85, 86, 88, 87, 86, 89, 87.5],
    bar: [
      { name: '计算机学院', value: 92.5 },
      { name: '软件学院', value: 91.0 },
      { name: '人工智能学院', value: 89.5 },
      { name: '经管学院', value: 86.0 },
      { name: '外国语学院', value: 84.5 }
    ]
  },
  // role: 0 普通教师数据
  TEACHER: {
    kpi: [
      { label: '本学期授课课时数', value: 64, unit: '节' },
      { label: '课堂平均出勤率', value: 96.8, unit: '%' },
      { label: '我的课堂平均得分', value: 85.2, unit: '分' }
    ],
    pie: [
      { name: '认真听讲', value: 1200 },
      { name: '举手互动', value: 300 },
      { name: '低头玩手机', value: 150 },
      { name: '趴桌睡觉', value: 50 },
      { name: '发呆/左顾右盼', value: 100 }
    ],
    line: [82, 84, 85, 83, 86, 88, 85.2],
    bar: [
      { name: '软件工程2301班', value: 88.5 },
      { name: '软件工程2302班', value: 86.0 },
      { name: '计算机科学2301班', value: 84.5 },
      { name: '网络工程2401班', value: 81.0 }
    ]
  }
}

// 基于当前角色动态计算的数据上下文
const currentData = computed(() => {
  return currentUser.value.role === 1 ? mockDataStore.ADMIN : mockDataStore.TEACHER
})

const kpiData = computed(() => currentData.value.kpi)

// 工具：获取近七天 (MM-DD)
const getLast7DaysString = () => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return days
}


// ============================================
// 三、 ECharts 渲染逻辑 (浅色企业级主题)
// ============================================

// DOM Nodes
const pieChartRef = ref(null)
const barChartRef = ref(null)
const lineChartRef = ref(null)

// Instances
let chartInstances = {
  pie: null,
  bar: null,
  line: null
}

// 主题配色 (Element 规范、清新、数据标准色)
const colorTheme = {
  primary: '#409EFF',   // 听讲/主要
  success: '#67C23A',   // 互动
  warning: '#E6A23C',   // 手机/发呆
  danger: '#F56C6C',    // 睡觉
  info: '#909399',      // 发呆
  lineGradStart: 'rgba(64, 158, 255, 0.4)',
  lineGradEnd: 'rgba(64, 158, 255, 0.05)',
  barGradStart: '#79bbff',
  barGradEnd: '#409EFF',
  textDefault: '#606266', // 核心文字
  lineSplit: '#EBEEF5'    // 分割线
}

// 初始化图表实例
const initCharts = () => {
  if (pieChartRef.value && !chartInstances.pie) chartInstances.pie = echarts.init(pieChartRef.value)
  if (barChartRef.value && !chartInstances.bar) chartInstances.bar = echarts.init(barChartRef.value)
  if (lineChartRef.value && !chartInstances.line) chartInstances.line = echarts.init(lineChartRef.value)
}

// 装载图表 Option 渲染
const renderCharts = () => {
  const data = currentData.value

  // [1] 饼图/环形图
  if (chartInstances.pie) {
    chartInstances.pie.setOption({
      tooltip: { trigger: 'item', backgroundColor: 'rgba(255, 255, 255, 0.9)' },
      legend: { bottom: '0%', left: 'center', textStyle: { color: colorTheme.textDefault } },
      color: [colorTheme.primary, colorTheme.success, colorTheme.warning, colorTheme.danger, colorTheme.info],
      series: [
        {
          name: '行为占比',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 18, fontWeight: 'bold', color: colorTheme.textDefault, formatter: '{b}\n{d}%' }
          },
          labelLine: { show: false },
          data: data.pie
        }
      ]
    })
  }

  // [2] 柱状排行榜（反向横放）
  if (chartInstances.bar) {
    const barDataCopy = [...data.bar].reverse()
    chartInstances.bar.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '10%', bottom: '5%', top: '5%', containLabel: true },
      xAxis: { type: 'value', max: 100, splitLine: { lineStyle: { color: colorTheme.lineSplit, type: 'dashed' } } },
      yAxis: {
        type: 'category',
        data: barDataCopy.map(d => d.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#DCDFE6' } },
        axisLabel: { color: colorTheme.textDefault, width: 90, overflow: 'truncate' }
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
          label: { show: true, position: 'right', color: colorTheme.primary, formatter: '{c}分', fontWeight: 600 },
          data: barDataCopy.map(d => d.value)
        }
      ]
    })
  }

  // [3] 折线图趋势
  if (chartInstances.line) {
    chartInstances.line.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '2%', right: '3%', bottom: '5%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: getLast7DaysString(),
        axisLine: { lineStyle: { color: '#DCDFE6' } },
        axisLabel: { color: colorTheme.textDefault }
      },
      yAxis: {
        type: 'value',
        max: 100,
        min: 0, // 可以改为通过打底分数动态min提升折线波动视觉效果
        splitLine: { lineStyle: { color: colorTheme.lineSplit, type: 'dashed' } },
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
          data: data.line
        }
      ]
    })
  }
}

// 容器自适应缩放（取消了 Scale，直接依靠 resize 事件重排）
const handleResize = () => {
  chartInstances.pie?.resize()
  chartInstances.bar?.resize()
  chartInstances.line?.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  nextTick(() => {
    initCharts()
    renderCharts()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  // 销毁全量实例保护内存
  Object.values(chartInstances).forEach(ins => {
    if(ins) ins.dispose()
  })
})
</script>

<style scoped>
/* 
  企业级标准浅色后台风格
  去除了绝对定位，回归标准普通流的相对结构
*/
.data-dashboard-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 84px); /* 预留给外部Navbar减去的高度，此处随意不影响排版 */
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #333;
}

.dashboard-header {
  display: flex;
  justify-content: flex-end;
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

/* Flex 工具模拟 (如已有 tailwind 可省略，保险起见手写) */
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
