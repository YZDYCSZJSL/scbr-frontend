<template>
  <div class="w-full h-full flex flex-col md:flex-row gap-5 overflow-hidden">
    <!-- 左侧主干区 (flex: 3) -->
    <div class="flex-[3] flex flex-col h-full gap-5 overflow-hidden">
      <!-- 专注度走势图 (上半部分: 铺满 ECharts) flex-[1.5] -->
      <div class="flex-[1.5] rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col relative">
        <div class="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
          <span class="text-sm font-bold text-gray-700">45分钟课堂专注度走势</span>
          <el-tag type="warning" size="small" effect="light" class="!border-none font-bold">实时聚合数据</el-tag>
        </div>
        <div class="flex-1 w-full relative p-2">
          <!-- Echarts 容器 -->
          <div ref="lineChartRef" class="w-full h-full absolute inset-0"></div>
        </div>
      </div>
      
      <!-- 违规照片抓拍墙 (下半部分) flex-1 -->
      <div class="flex-[1.2] rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col">
        <div class="p-3 border-b border-gray-100 bg-gray-50 shrink-0 flex items-center gap-2">
          <span class="text-sm font-bold text-gray-700">违规行为强抓拍墙</span>
          <span class="text-xs text-gray-400 font-normal">记录违规关键帧证据</span>
        </div>
        <!-- 横向滚动的卡片列表 -->
        <div class="flex-1 px-4 pt-3 pb-5 overflow-x-auto overflow-y-hidden flex gap-4 items-center bg-gray-50/50 custom-scrollbar">
          <template v-if="snapshots && snapshots.length > 0">
            <div 
              v-for="(item, index) in snapshots" 
              :key="index" 
              class="shrink-0 w-56 relative group rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer bg-white mb-5"
            >
              <el-image 
                :src="item.url" 
                class="w-56 h-36 object-cover" 
                :preview-src-list="snapshots.map(s => s.url)"
                :initial-index="index"
                fit="cover" 
              />
              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-3 pt-6 flex justify-between items-end">
                <span class="font-mono">{{ item.time }}</span>
                <span class="bg-red-500/80 px-2 py-0.5 rounded text-[10px] font-bold">{{ item.type }}</span>
              </div>
            </div>
          </template>
          <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <el-icon :size="40" class="mb-3 opacity-50"><Picture /></el-icon>
            <span class="text-sm">暂无违规抓拍记录，本堂课纪律优良</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧侧边栏 (flex: 1) -->
    <div class="flex-1 flex flex-col h-full gap-5 overflow-hidden">
      <!-- 违规人次占比圆环饼图 -->
      <div class="flex-[1.6] rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col">
        <div class="p-3 border-b border-gray-100 bg-gray-50 shrink-0">
          <span class="text-sm font-bold text-gray-700">整堂课总行为占比统计</span>
        </div>
        <div class="flex-1 w-full relative p-2">
          <div ref="pieChartRef" class="w-full h-full absolute inset-0"></div>
        </div>
      </div>

      <!-- 宏观评估建议或综合统计文字 -->
      <div class="flex-1 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col bg-gradient-to-br from-blue-50/50 to-indigo-50/20">
        <div class="p-3 border-b border-gray-100 bg-transparent shrink-0">
          <span class="text-sm font-bold text-indigo-900">宏观智能评估建议</span>
        </div>
        <div class="flex-1 p-5 overflow-y-auto text-sm text-gray-700 leading-relaxed custom-scrollbar">
          <p class="mb-3 font-extrabold text-indigo-800 text-base">课程综合评价：</p>
          <p class="mb-4">
            本节《{{ taskData.courseName || '该课程' }}》整体课堂纪律
            <span class="font-bold border-b-2" :class="taskData.totalScore >= 80 ? 'text-emerald-600 border-emerald-200' : (taskData.totalScore >= 60 ? 'text-amber-600 border-amber-200' : 'text-red-500 border-red-200')">
              {{ taskData.totalScore >= 80 ? '表现优异' : (taskData.totalScore >= 60 ? '中规中矩' : '有待加强') }}
            </span>
            。从实时流监测结果来看，大多数学生在认真听讲，整体专注度展现出较好的稳定性。
          </p>
          <div class="bg-white/60 p-3 rounded-lg border border-indigo-100 shadow-sm">
            <p class="mb-2 font-bold text-indigo-800 flex items-center gap-1">
              <el-icon><Star /></el-icon> 教学质量改进建议：
            </p>
            <ul class="list-none pl-1 space-y-3">
              <li class="relative pl-4 before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:bg-amber-400 before:rounded-full">
                课堂后半段 (25-40分钟) 出现典型的注意力涣散期，建议引入师生互动或随堂小测环节以重新激活课堂。
              </li>
              <li class="relative pl-4 before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:bg-red-400 before:rounded-full">
                后排及角落区域的学生“低头/玩手机”频次相较前排高出20%，请教师适度加强教室巡视。
              </li>
              <li class="relative pl-4 before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:bg-blue-400 before:rounded-full">
                建议结合知识点难度进行针对性提问，直接唤醒“趴桌”或走神学生的注意力。
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import * as echarts from 'echarts'
import { Picture, Star } from '@element-plus/icons-vue'

const props = defineProps({
  taskData: {
    type: Object,
    required: true
  }
})

const lineChartRef = ref(null)
const pieChartRef = ref(null)
// 使用 shallowRef 存储 ECharts 实例，避免 Vue 响应式代理开销
const lineChart = shallowRef(null)
const pieChart = shallowRef(null)

// 模拟抓拍墙数据
// 实际场景应从接口获取 taskData.snapshots
const snapshots = ref([
  { time: 'T+12:30', type: '玩弄手机', url: 'https://images.unsplash.com/photo-1577563908411-5079b6e1ee89?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
  { time: 'T+22:15', type: '趴桌睡觉', url: 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
  { time: 'T+38:40', type: '玩手机/走神', url: 'https://images.unsplash.com/photo-1510515152865-c7cd25d4f165?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
  { time: 'T+41:20', type: '趴桌睡觉', url: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }
])

const initLineChart = () => {
  if (!lineChartRef.value) return
  if (!lineChart.value) {
    lineChart.value = echarts.init(lineChartRef.value)
  }
  
  // 模拟45分钟的X轴 (1到45)
  const xAxisData = Array.from({length: 45}, (_, i) => `${i + 1}分`)
  
  // 模拟各类行为波动数据：受基础人数影响
  const baseCount = props.taskData.attendanceCount || 45
  
  // 听课人数随时间在前30分钟保持较高，后部分衰减
  const listeningData = xAxisData.map((_, i) => {
    let focusRate = i < 25 ? (0.7 + Math.random() * 0.2) : (0.5 + Math.random() * 0.3)
    return Math.floor(baseCount * focusRate)
  })
  
  // 违纪随时间呈上升趋势
  const playingData = xAxisData.map((_, i) => Math.floor(baseCount * (i / 45 * 0.2 + Math.random() * 0.05)))
  const sleepingData = xAxisData.map((_, i) => Math.floor(baseCount * (i / 45 * 0.15 + Math.random() * 0.05)))

  const option = {
    tooltip: { 
      trigger: 'axis',
      axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } }
    },
    legend: { 
      data: ['听课', '玩手机', '趴桌'], 
      bottom: 5,
      icon: 'circle'
    },
    grid: { left: '8%', right: '5%', bottom: '15%', top: '16%', containLabel: true },
    xAxis: { 
      type: 'category', 
      boundaryGap: false, 
      data: xAxisData, 
      axisLabel: { interval: 8, color: '#64748b' },
      axisLine: { lineStyle: { color: '#e2e8f0' } }
    },
    yAxis: { 
      type: 'value', 
      name: '人次',
      nameTextStyle: { color: '#64748b' },
      splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
      axisLabel: { color: '#64748b' }
    },
    series: [
      { 
        name: '听课', 
        type: 'line', 
        smooth: true, 
        symbol: 'none',
        lineStyle: { width: 3 },
        itemStyle: { color: '#10b981' }, 
        areaStyle: { 
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16,185,129,0.3)' },
            { offset: 1, color: 'rgba(16,185,129,0)' }
          ])
        }, 
        data: listeningData 
      },
      { 
        name: '玩手机', 
        type: 'line', 
        smooth: true, 
        symbol: 'none',
        lineStyle: { width: 2 },
        itemStyle: { color: '#ef4444' }, 
        data: playingData 
      },
      { 
        name: '趴桌', 
        type: 'line', 
        smooth: true, 
        symbol: 'none',
        lineStyle: { width: 2 },
        itemStyle: { color: '#f59e0b' }, 
        data: sleepingData }
    ]
  }
  lineChart.value.setOption(option)
}

const initPieChart = () => {
  if (!pieChartRef.value) return
  if (!pieChart.value) {
    pieChart.value = echarts.init(pieChartRef.value)
  }
  
  const behaviors = props.taskData.behaviors || []
  const data = behaviors.length > 0 ? behaviors.map(b => ({
    name: b.name,
    value: b.count,
    // FIX: 修复饼图颜色失效问题（原由于 b.type 可能无值而均被置为同一默认色），如果有预设映射则使用，否则回退给外层调色盘处理
    itemStyle: b.type ? { color: getBehaviorProgressColor(b.type) } : undefined
  })) : [
    { value: 40, name: '认真听讲', itemStyle: { color: '#10b981' } },
    { value: 5, name: '玩弄手机', itemStyle: { color: '#ef4444' } },
    { value: 3, name: '趴桌睡觉', itemStyle: { color: '#f59e0b' } },
    { value: 2, name: '举手互动', itemStyle: { color: '#3b82f6' } }
  ];

  const option = {
    // FIX: 为饼图组件增加全局多色调调色盘，分配不同类型的颜色
    color: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'],
    tooltip: { 
      trigger: 'item', 
      formatter: '{b}: <span style="font-weight:bold;">{c}</span>人次 <br/> 占比 ({d}%)' 
    },
    legend: { 
      orient: 'horizontal', 
      bottom: 5, 
      left: 'center',
      textStyle: { fontSize: 12, color: '#475569' },
      itemWidth: 12,
      itemHeight: 12
    },
    series: [
      {
        name: '行为占比',
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { 
          show: true,
          formatter: '{b}\n{d}%',
          color: '#475569',
          fontSize: 11
        },
        labelLine: { 
          show: true,
          length: 10,
          length2: 15,
          smooth: true
        },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' }
        },
        data: data
      }
    ]
  }
  pieChart.value.setOption(option)
}

const getBehaviorProgressColor = (type) => {
  const map = {
    listening: '#10b981',
    playing_phone: '#ef4444',
    sleeping: '#f59e0b',
    raising_hand: '#3b82f6',
    // FIX: 兼容数据库或后端直接传来的中文 behavior_type
    '正常听课': '#10b981',
    '认真听讲': '#10b981',
    '玩手机': '#ef4444',
    '玩弄手机': '#ef4444',
    '趴桌': '#f59e0b',
    '趴桌睡觉': '#f59e0b',
    '举手互动': '#3b82f6'
  }
  return map[type] || undefined // 回退为 undefined 交给 echarts 多色调色盘处理
}

onMounted(() => {
  // 延迟初始化防止由于弹窗开启动画导致的宽高计算问题（ECharts渲染黑屏问题）
  setTimeout(() => {
    initLineChart()
    initPieChart()
  }, 300)
  
  window.addEventListener('resize', handleResize)
})

const handleResize = () => {
  if (lineChart.value) lineChart.value.resize()
  if (pieChart.value) pieChart.value.resize()
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (lineChart.value) {
    lineChart.value.dispose()
    lineChart.value = null
  }
  if (pieChart.value) {
    pieChart.value.dispose()
    pieChart.value = null
  }
})

watch(() => props.taskData, () => {
  initLineChart()
  initPieChart()
}, { deep: true })
</script>

<style scoped>
/* 自定义滚动条隐蔽美观 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
</style>
