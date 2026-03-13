<template>
  <el-dialog
    v-model="visible"
    title="课程历史分析任务详情"
    width="1000px"
    top="6vh"
    @closed="handleClose"
    class="custom-report-dialog bg-gray-100"
    destroy-on-close
  >
    <!-- 全局高度限制与 Flex 布局撑开内部 -->
    <div v-loading="loading" class="flex flex-col gap-4 text-gray-800" style="height: 65vh; min-height: 500px;">
      
      <!--========================================
        1. 顶部：公共战报看板 
        固定展示得分、应到实到人数及基础属性
      ========================================-->
      <div class="shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm p-4 px-6 flex justify-between items-center bg-gradient-to-r from-blue-50/40 via-white to-white relative overflow-hidden">
        <!-- 装饰图案 -->
        <div class="absolute -left-10 -top-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        
        <!-- 左区域：课程与基础 -->
        <div class="flex items-center gap-3 flex-1 min-w-0 relative z-10">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 flex flex-shrink-0 items-center justify-center text-white">
            <el-icon :size="24"><DataBoard /></el-icon>
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <h3 class="text-xl font-black m-0 leading-tight text-gray-800 tracking-tight truncate" :title="taskData.courseName || '未知课程分析'">
              {{ taskData.courseName || '未知课程分析' }}
            </h3>
            <p class="text-xs text-gray-500 mt-1 flex gap-3 font-medium min-w-0 w-full">
              <span class="flex items-center gap-1 whitespace-nowrap shrink-0">
                <el-icon><User /></el-icon> {{ taskData.teacherName || '-' }}
              </span>
              <span class="flex items-center gap-1 min-w-0 cursor-default" :title="taskData.classroomName || '-'">
                <el-icon class="shrink-0"><Location /></el-icon> 
                <span class="truncate">{{ taskData.classroomName || '-' }}</span>
              </span>
            </p>
          </div>
        </div>
        
        <!-- 中区域：数据源与人数 -->
        <div class="flex items-center gap-6 relative z-10 shrink-0 mx-4">
          <!-- 分析类型标签 -->
          <div class="flex flex-col px-3 items-center">
            <span class="text-xs text-gray-400 mb-1 font-bold uppercase tracking-wider">数据源模式</span>
            <div>
              <el-tag v-if="taskData.mediaType === 1" type="info" effect="light" class="!border-none" round size="small">
                <div class="flex items-center gap-1"><el-icon><Picture /></el-icon> 静态图片快照</div>
              </el-tag>
              <el-tag v-else-if="taskData.mediaType === 2" type="primary" effect="light" class="!border-none" round size="small">
                <div class="flex items-center gap-1"><el-icon><VideoCamera /></el-icon> 视频回放流</div>
              </el-tag>
              <el-tag v-else-if="taskData.mediaType === 3" type="warning" effect="light" class="!border-none bg-orange-100 text-orange-600" round size="small">
                <div class="flex items-center gap-1"><el-icon><Monitor /></el-icon> AI实时监控流</div>
              </el-tag>
              <el-tag v-else type="info" size="small">未知类型</el-tag>
            </div>
          </div>

          <el-divider direction="vertical" class="h-10 mx-0" />

          <!-- 考勤数据板 -->
          <div class="flex flex-col px-3 items-center">
            <span class="text-xs text-gray-400 mb-0 font-bold uppercase tracking-wider">检测人数</span>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-2xl font-black text-indigo-600 font-mono leading-none">{{ taskData.attendanceCount || 0 }}</span>
              <span class="text-xs text-gray-500 font-bold">人</span>
            </div>
          </div>
        </div>

        <!-- 右区域：综合得分与等级 -->
        <div class="flex-1 flex justify-end relative z-10 min-w-0">
          <div class="shrink-0 flex items-center gap-4 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 rounded-xl border border-gray-200">
            <div class="flex flex-col text-right">
              <span class="text-xs font-extrabold text-gray-700 mb-1">班级AI综合评分</span>
              <div class="flex items-center gap-1 justify-end">
                <span class="text-[10px] font-bold text-gray-400 scale-90">STATUS</span>
                <el-tag :type="getStatusType(taskData.status)" size="small" effect="dark" round class="border-0 shadow-sm leading-none font-bold">
                  {{ getStatusName(taskData.status) }}
                </el-tag>
              </div>
            </div>
            
            <div class="text-4xl font-black font-mono tracking-tighter" :class="getScoreColor(taskData.totalScore)" style="text-shadow: 0 4px 10px rgba(0,0,0,0.05)">
              {{ taskData.status === 2 ? Number(taskData.totalScore).toFixed(1) : '-' }}
            </div>
            
            <div v-if="taskData.status === 2" class="flex flex-col gap-1 items-start w-20">
              <el-tag :type="getScoreTagType(taskData.totalScore)" effect="dark" size="small" class="font-black tracking-widest w-full text-center border-0 shadow-sm" round>
                {{ getScoreLevel(taskData.totalScore) }}
              </el-tag>
              <el-rate :model-value="getStarCount(taskData.totalScore)" disabled :max="5" text-color="#ff9900" size="small" class="-mt-1 !h-auto flex justify-center w-full scale-75 origin-left" />
            </div>
          </div>
        </div>
      </div>

      <!--========================================
        2. 主体内容区
        动态渲染子组件，保持左3右1的Flex比例
      ========================================-->
      <div class="flex-1 w-full relative overflow-hidden rounded-xl bg-transparent flex flex-col">
        <!-- 条件渲染子组件，传递完整的 taskData。子组件内部实现 flex 布局撑满此空间 -->
        <FileStreamView 
          v-if="taskData.mediaType === 1 || taskData.mediaType === 2" 
          :taskData="taskData" 
        />
        
        <RealtimeDashboard 
          v-else-if="taskData.mediaType === 3" 
          :taskData="taskData" 
        />
        
        <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
          <el-icon :size="64" class="mb-4 text-gray-300"><WarningFilled /></el-icon>
          <span class="text-xl font-bold text-gray-500">此任务无媒体类型，或仍在排队解析中</span>
          <p class="text-sm mt-2">只有当分析状态达到「分析完成」并且具备正确的媒体格式方可预览详情</p>
        </div>
      </div>
    </div>
    
    <!--========================================
        3. 底部操作栏
    ========================================-->
    <template #footer>
      <div class="flex justify-between items-center w-full px-2 pt-2 border-t border-gray-100 mt-4">
        <span class="text-xs font-bold text-gray-400">系统生成时间：{{ taskData.createdAt || '-' }}</span>
        <div class="dialog-footer space-x-3">
          <el-button @click="visible = false" class="font-bold px-6">关 闭</el-button>
          <el-button type="primary" @click="handleDownloadReport" :disabled="taskData.status !== 2" class="font-bold px-6 shadow-md shadow-blue-500/30">
            <el-icon class="mr-1"><Download /></el-icon> 导出报表
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { 
  DataBoard, User, Location, WarningFilled, 
  Picture, VideoCamera, Monitor, Download
} from '@element-plus/icons-vue'
import { getReportDetail, exportReportToExcel } from '../api/index'
import { ElMessage } from 'element-plus'

// 引入拆分的两个子组件
import FileStreamView from './FileStreamView.vue'
import RealtimeDashboard from './RealtimeDashboard.vue'

// 控制弹窗显示隐藏
const visible = ref(false)
const loading = ref(false)

// 响应式数据源
const taskData = reactive({
  id: '',
  courseName: '',
  teacherName: '',
  classroomName: '',
  mediaType: null,
  createdAt: '',
  status: null,
  totalScore: 0,
  attendanceCount: 0,
  fileUrl: '',
  behaviors: [],
  detailList: []
})

// 中文行为映射表
const getBehaviorName = (type) => {
  return type || '-'
}

/**
 * 外部调用暴露的 open 方法
 */
const open = async (row) => {
  if (!row) return
  visible.value = true
  loading.value = true
  
  try {
    const res = await getReportDetail(row.id)
    if (res) {
      const data = res
      const normalizedDetailList = Array.isArray(data.detailList)
      ? data.detailList.map(item => {
          const boxes = Array.isArray(item.boundingBoxes) ? item.boundingBoxes : []
          const rawCount = Number(item.count || 0)

          return {
            recordType: item.recordType,
            frameTime: Number(item.frameTime || 0),
            behaviorType: item.behaviorType || '',
            count: boxes.length > 0 ? boxes.length : rawCount,
            boundingBoxes: boxes,
            snapshotUrl: item.snapshotUrl || null
          }
        })
      : []

      Object.assign(taskData, {
        id: data.id,
        courseName: data.courseName,
        teacherName: data.teacherName,
        classroomName: data.classroomName,
        mediaType: data.mediaType,
        createdAt: data.createdAt,
        status: data.status,
        totalScore: data.totalScore ? Number(data.totalScore) : 0,
        attendanceCount: data.attendanceCount || 0,
        fileUrl: data.fileUrl || '',
        detailList: normalizedDetailList,
        behaviors: normalizedDetailList.map(item => ({
          type: item.behaviorType,
          name: item.behaviorType,
          count: item.count
        }))
      })
    } else {
      ElMessage.error('获取详情失败')
    }
  } catch (error) {
    console.error('getReportDetail error:', error)
    ElMessage.error('获取详情出现异常')
  } finally {
    loading.value = false
  }
}

defineExpose({ open })

const handleClose = () => {
  // 重置状态
 taskData.id = ''
  taskData.courseName = ''
  taskData.teacherName = ''
  taskData.classroomName = ''
  taskData.mediaType = null
  taskData.createdAt = ''
  taskData.status = null
  taskData.totalScore = 0
  taskData.attendanceCount = 0
  taskData.fileUrl = ''
  taskData.behaviors = []
  taskData.detailList = []
}

const handleDownloadReport = async () => {
  if (!taskData.id) return
  ElMessage.info('正在导出本报告...')
  try {
    await exportReportToExcel([taskData.id])
    ElMessage.success('导出完成')
  } catch (error) {
    console.error('export error:', error)
    ElMessage.error('导出失败')
  }
}

/* ================= 工具方法 ================= */
const getStatusName = (status) => {
  const map = { 0: '排队中', 1: '解析中', 2: '分析完成', 3: '异常中止' }
  return map[status] || '未知'
}

const getStatusType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }
  return map[status] || 'info'
}

const getScoreColor = (score) => {
  if (score >= 80) return 'text-emerald-500'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
}

const getScoreTagType = (score) => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

const getScoreLevel = (score) => {
  if (score >= 85) return '优 秀'
  if (score >= 70) return '良 好'
  if (score >= 60) return '及 格'
  return '不 及 格'
}

const getStarCount = (score) => {
  return Number((score / 20).toFixed(1))
}
</script>

<style scoped>
/* 自定义超长弹窗体无内边距，靠内部元素撑开间隙，提升科技感与美观度 */
.custom-report-dialog :deep(.el-dialog__body) {
  padding: 20px;
  background-color: #f1f5f9; /* Tailwind slate-100 */
}
.custom-report-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 15px;
  font-weight: 900;
}
.custom-report-dialog :deep(.el-dialog__footer) {
  padding: 10px 20px 20px;
  background-color: #f1f5f9;
}
</style>
