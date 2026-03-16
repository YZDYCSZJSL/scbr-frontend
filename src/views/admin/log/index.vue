<template>
  <div class="flex flex-col h-full gap-4">
    <!-- <el-alert
      title="本页面用于查看系统登录日志、操作日志和任务执行日志，仅管理员可访问。"
      type="info"
      :closable="false"
      show-icon
      class="shrink-0 bg-blue-50 text-blue-800 border-blue-100"
    /> -->

    <!-- 顶栏 (类似参考图样式) -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 shrink-0">
      <div class="w-12 h-12 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center shrink-0">
        <el-icon :size="24"><Memo /></el-icon>
      </div>
      <div class="flex flex-col">
        <span class="text-[17px] font-bold text-gray-800 tracking-wide">日志中心</span>
        <span class="text-[12px] text-gray-400 mt-1">查看系统登录、操作和任务执行日志</span>
      </div>
    </div>

    <div class="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col p-4">
      <el-tabs v-model="activeTab" class="flex-1 flex flex-col" @tab-change="handleTabChange">
        <!-- 登录日志 -->
        <el-tab-pane label="登录日志" name="login" class="h-full flex flex-col">
          <div class="flex flex-wrap items-center gap-3 mb-4 shrink-0">
            <el-input v-model="loginQuery.empNo" placeholder="工号" clearable class="w-40" />
            <el-input v-model="loginQuery.userName" placeholder="用户名" clearable class="w-40" />
            <el-select v-model="loginQuery.loginStatus" placeholder="登录状态" clearable class="w-32">
              <el-option label="成功" :value="1" />
              <el-option label="失败" :value="0" />
            </el-select>
            <el-date-picker
              v-model="loginDateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              class="!w-[240px]"
            />
            <el-button type="primary" color="#409eff" class="px-5 font-medium ml-1" @click="fetchLoginLogs">查询</el-button>
            <el-button class="px-4 font-medium" plain @click="resetLoginQuery">重置</el-button>
          </div>

          <el-table v-loading="loginLoading" :data="loginTableData" stripe class="flex-1" height="100%">
            <el-table-column prop="empNo" label="工号" min-width="120" />
            <el-table-column prop="userName" label="用户名" min-width="120" />
            <el-table-column label="登录状态" min-width="100">
              <template #default="{ row }">
                <el-tag :type="Number(row.loginStatus) === 1 ? 'success' : 'danger'" size="small">
                  {{ Number(row.loginStatus) === 1 ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="loginMessage" label="登录结果" min-width="180" show-overflow-tooltip />
            <el-table-column prop="ipAddress" label="IP地址" min-width="140" />
            <el-table-column prop="userAgent" label="客户端信息" min-width="220" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="登录时间" min-width="180" />
          </el-table>

          <div class="mt-4 flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 shrink-0">
            <div class="text-sm text-gray-500 font-medium ml-2">检索结果：<span class="text-blue-600 font-bold mx-1">{{ loginTotal }}</span>条数据</div>
            <el-pagination
              background
              layout="sizes, prev, pager, next, jumper"
              :total="loginTotal"
              :current-page="loginQuery.page"
              :page-size="loginQuery.size"
              :page-sizes="[10, 20, 50, 100]"
              @current-change="handleLoginPageChange"
              @size-change="handleLoginSizeChange"
            />
          </div>
        </el-tab-pane>

        <!-- 操作日志 -->
        <el-tab-pane label="操作日志" name="operation" class="h-full flex flex-col">
          <div class="flex flex-wrap items-center gap-3 mb-4 shrink-0">
            <el-input v-model="operationQuery.empNo" placeholder="工号" clearable class="w-32" />
            <el-input v-model="operationQuery.moduleName" placeholder="模块名称" clearable class="w-36" />
            <el-select
              v-model="operationQuery.operationType"
              placeholder="操作类型"
              clearable
              class="w-40"
            >
              <el-option
                v-for="item in operationTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-select v-model="operationQuery.operationStatus" placeholder="操作状态" clearable class="w-32">
              <el-option label="成功" :value="1" />
              <el-option label="失败" :value="0" />
            </el-select>
            <el-date-picker
              v-model="operationDateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              class="!w-[240px]"
            />
            <el-button type="primary" color="#409eff" class="px-5 font-medium ml-1" @click="fetchOperationLogs">查询</el-button>
            <el-button class="px-4 font-medium" plain @click="resetOperationQuery">重置</el-button>
          </div>

          <el-table v-loading="operationLoading" :data="operationTableData" stripe class="flex-1" height="100%">
            <el-table-column prop="empNo" label="工号" min-width="120" />
            <el-table-column prop="userName" label="操作人" min-width="120" />
            <el-table-column prop="moduleName" label="模块名称" min-width="140" />
            <el-table-column label="操作类型" min-width="140">
              <template #default="{ row }">
                {{ getOperationTypeName(row.operationType) }}
              </template>
            </el-table-column>
            <el-table-column prop="businessId" label="业务ID" min-width="100" />
            <el-table-column prop="operationDesc" label="操作说明" min-width="220" show-overflow-tooltip />
            <el-table-column label="操作状态" min-width="100">
              <template #default="{ row }">
                <el-tag :type="Number(row.operationStatus) === 1 ? 'success' : 'danger'" size="small">
                  {{ Number(row.operationStatus) === 1 ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="requestMethod" label="请求方法" min-width="100" />
            <el-table-column prop="requestUrl" label="请求路径" min-width="200" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="操作时间" min-width="180" />
          </el-table>

          <div class="mt-4 flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 shrink-0">
            <div class="text-sm text-gray-500 font-medium ml-2">检索结果：<span class="text-blue-600 font-bold mx-1">{{ operationTotal }}</span>条数据</div>
            <el-pagination
              background
              layout="sizes, prev, pager, next, jumper"
              :total="operationTotal"
              :current-page="operationQuery.page"
              :page-size="operationQuery.size"
              :page-sizes="[10, 20, 50, 100]"
              @current-change="handleOperationPageChange"
              @size-change="handleOperationSizeChange"
            />
          </div>
        </el-tab-pane>

        <!-- 任务日志 -->
        <el-tab-pane label="任务日志" name="task" class="h-full flex flex-col">
          <div class="flex flex-wrap items-center gap-3 mb-4 shrink-0">
            <el-input v-model="taskQuery.taskId" placeholder="任务ID" clearable class="w-40" />
            <el-select
              v-model="taskQuery.stage"
              placeholder="阶段"
              clearable
              class="w-40"
            >
              <el-option
                v-for="item in taskStageOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-select v-model="taskQuery.status" placeholder="状态" clearable class="w-32">
              <el-option label="成功" :value="1" />
              <el-option label="失败" :value="0" />
            </el-select>
            <el-date-picker
              v-model="taskDateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              class="!w-[240px]"
            />
            <el-button type="primary" color="#409eff" class="px-5 font-medium ml-1" @click="fetchTaskLogs">查询</el-button>
            <el-button class="px-4 font-medium" plain @click="resetTaskQuery">重置</el-button>
          </div>

          <el-table v-loading="taskLoading" :data="taskTableData" stripe class="flex-1" height="100%">
            <el-table-column prop="taskId" label="任务ID" min-width="100" />
            <el-table-column label="阶段" min-width="140">
              <template #default="{ row }">
                {{ getTaskStageName(row.stage) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" min-width="100">
              <template #default="{ row }">
                <el-tag :type="Number(row.status) === 1 ? 'success' : 'danger'" size="small">
                  {{ Number(row.status) === 1 ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="日志说明" min-width="220" show-overflow-tooltip />
            <el-table-column label="详情" min-width="260" show-overflow-tooltip>
              <template #default="{ row }">
                {{ formatTaskDetail(row.detailJson) }}
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="记录时间" min-width="180" />
          </el-table>

          <div class="mt-4 flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 shrink-0">
            <div class="text-sm text-gray-500 font-medium ml-2">检索结果：<span class="text-blue-600 font-bold mx-1">{{ taskTotal }}</span>条数据</div>
            <el-pagination
              background
              layout="sizes, prev, pager, next, jumper"
              :total="taskTotal"
              :current-page="taskQuery.page"
              :page-size="taskQuery.size"
              :page-sizes="[10, 20, 50, 100]"
              @current-change="handleTaskPageChange"
              @size-change="handleTaskSizeChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Memo } from '@element-plus/icons-vue'
import {
  getLoginLogPage,
  getOperationLogPage,
  getTaskLogPage
} from './api'


const activeTab = ref(localStorage.getItem('logCenterActiveTab') || 'login')

const loginLoading = ref(false)
const operationLoading = ref(false)
const taskLoading = ref(false)

const operationLoaded = ref(false)
const taskLoaded = ref(false)

const loginTableData = ref([])
const operationTableData = ref([])
const taskTableData = ref([])

const loginTotal = ref(0)
const operationTotal = ref(0)
const taskTotal = ref(0)

const loginDateRange = ref([])
const operationDateRange = ref([])
const taskDateRange = ref([])

const loginQuery = reactive({
  page: 1,
  size: 10,
  empNo: '',
  userName: '',
  loginStatus: undefined,
  startDate: '',
  endDate: ''
})

const operationTypeOptions = [
  { label: '新增教师', value: 'CREATE_TEACHER' },
  { label: '修改教师', value: 'UPDATE_TEACHER' },
  { label: '删除教师', value: 'DELETE_TEACHER' },
  { label: '新增课程', value: 'CREATE_COURSE' },
  { label: '修改课程', value: 'UPDATE_COURSE' },
  { label: '删除课程', value: 'DELETE_COURSE' },
  { label: '新增教室', value: 'CREATE_CLASSROOM' },
  { label: '修改教室', value: 'UPDATE_CLASSROOM' },
  { label: '删除教室', value: 'DELETE_CLASSROOM' },
  { label: '新增排课', value: 'CREATE_SCHEDULE' },
  { label: '修改排课', value: 'UPDATE_SCHEDULE' },
  { label: '删除排课', value: 'DELETE_SCHEDULE' },
  { label: '发起分析任务', value: 'CREATE_ANALYSIS_TASK' },
  { label: '重试分析任务', value: 'RETRY_TASK' },
  { label: '导出课堂分析报告', value: 'EXPORT_REPORT' },
  { label: '激活系统参数方案', value: 'ACTIVATE_CONFIG' }
]

const taskStageOptions = [
  { label: '任务创建', value: 'CREATED' },
  { label: '文件上传', value: 'UPLOADED' },
  { label: '开始分析', value: 'RUNNING' },
  { label: '等待回调', value: 'WAITING_CALLBACK' },
  { label: '执行完成', value: 'FINISHED' },
  { label: '执行失败', value: 'FAILED' },
  { label: '任务重试', value: 'RETRY' }
]

function getOperationTypeName(type) {
  const map = {
    CREATE_TEACHER: '新增教师',
    UPDATE_TEACHER: '修改教师',
    DELETE_TEACHER: '删除教师',
    CREATE_COURSE: '新增课程',
    UPDATE_COURSE: '修改课程',
    DELETE_COURSE: '删除课程',
    CREATE_CLASSROOM: '新增教室',
    UPDATE_CLASSROOM: '修改教室',
    DELETE_CLASSROOM: '删除教室',
    CREATE_SCHEDULE: '新增排课',
    UPDATE_SCHEDULE: '修改排课',
    DELETE_SCHEDULE: '删除排课',
    CREATE_ANALYSIS_TASK: '发起分析任务',
    RETRY_TASK: '重试分析任务',
    EXPORT_REPORT: '导出课堂分析报告',
    ACTIVATE_CONFIG: '激活系统参数方案'
  }
  return map[type] || type || '-'
}

function getTaskStageName(stage) {
  const map = {
    CREATED: '任务创建',
    UPLOADED: '文件上传',
    RUNNING: '开始分析',
    WAITING_CALLBACK: '等待回调',
    FINISHED: '执行完成',
    FAILED: '执行失败',
    RETRY: '任务重试'
  }
  return map[stage] || stage || '-'
}

function formatTaskDetail(detailJson) {
  if (!detailJson) return '-'

  if (typeof detailJson === 'string') {
    try {
      detailJson = JSON.parse(detailJson)
    } catch (e) {
      return detailJson
    }
  }

  if (typeof detailJson !== 'object') {
    return String(detailJson)
  }

  const textMap = {
    totalScore: '综合得分',
    attendanceCount: '实到人数',
    mediaType: '媒体类型',
    scheduleId: '排课ID',
    fileId: '文件ID',
    fileName: '文件名',
    startTime: '开始时间',
    progress: '进度',
    retryCount: '重试次数',
    rawError: '原始错误'
  }

  const mediaTypeMap = {
    1: '图片',
    2: '视频',
    3: '实时流'
  }

  const parts = Object.entries(detailJson).map(([key, value]) => {
    let finalValue = value

    if (key === 'mediaType') {
      finalValue = mediaTypeMap[value] || value
    }

    return `${textMap[key] || key}: ${finalValue}`
  })

  return parts.join('；')
}

const operationQuery = reactive({
  page: 1,
  size: 10,
  empNo: '',
  moduleName: '',
  operationType: '',
  operationStatus: undefined,
  startDate: '',
  endDate: ''
})

const taskQuery = reactive({
  page: 1,
  size: 10,
  taskId: '',
  stage: '',
  status: undefined,
  startDate: '',
  endDate: ''
})

onMounted(() => {
  if (activeTab.value === 'login') {
    fetchLoginLogs()
  } else if (activeTab.value === 'operation') {
    fetchOperationLogs()
    operationLoaded.value = true
  } else if (activeTab.value === 'task') {
    fetchTaskLogs()
    taskLoaded.value = true
  }
})

function handleTabChange(tabName) {
  localStorage.setItem('logCenterActiveTab', tabName)

  if (tabName === 'operation' && !operationLoaded.value) {
    fetchOperationLogs()
    operationLoaded.value = true
  }

  if (tabName === 'task' && !taskLoaded.value) {
    fetchTaskLogs()
    taskLoaded.value = true
  }
}

async function fetchLoginLogs() {
  loginLoading.value = true
  try {
    const params = { ...loginQuery }
    if (loginDateRange.value?.length === 2) {
      params.startDate = loginDateRange.value[0]
      params.endDate = loginDateRange.value[1]
    } else {
      params.startDate = ''
      params.endDate = ''
    }

    const res = await getLoginLogPage(params)
    loginTableData.value = res.records || res.list || []
    loginTotal.value = res.total || 0
    loginQuery.page = res.current || loginQuery.page
    loginQuery.size = res.size || loginQuery.size
  } catch (error) {
    console.error(error)
    ElMessage.error('获取登录日志失败')
  } finally {
    loginLoading.value = false
  }
}

async function fetchOperationLogs() {
  operationLoading.value = true
  try {
    const params = { ...operationQuery }
    if (operationDateRange.value?.length === 2) {
      params.startDate = operationDateRange.value[0]
      params.endDate = operationDateRange.value[1]
    } else {
      params.startDate = ''
      params.endDate = ''
    }

    const res = await getOperationLogPage(params)
    operationTableData.value = res.records || res.list || []
    operationTotal.value = res.total || 0
    operationQuery.page = res.current || operationQuery.page
    operationQuery.size = res.size || operationQuery.size
    operationLoaded.value = true
  } catch (error) {
    console.error(error)
    ElMessage.error('获取操作日志失败')
  } finally {
    operationLoading.value = false
  }
}

async function fetchTaskLogs() {
  taskLoading.value = true
  try {
    const params = { ...taskQuery }
    if (taskDateRange.value?.length === 2) {
      params.startDate = taskDateRange.value[0]
      params.endDate = taskDateRange.value[1]
    } else {
      params.startDate = ''
      params.endDate = ''
    }

    const res = await getTaskLogPage(params)
    taskTableData.value = res.records || res.list || []
    taskTotal.value = res.total || 0
    taskQuery.page = res.current || taskQuery.page
    taskQuery.size = res.size || taskQuery.size
    taskLoaded.value = true
  } catch (error) {
    console.error(error)
    ElMessage.error('获取任务日志失败')
  } finally {
    taskLoading.value = false
  }
}

function resetLoginQuery() {
  loginQuery.page = 1
  loginQuery.size = 10
  loginQuery.empNo = ''
  loginQuery.userName = ''
  loginQuery.loginStatus = undefined
  loginDateRange.value = []
  fetchLoginLogs()
}

function resetOperationQuery() {
  operationQuery.page = 1
  operationQuery.size = 10
  operationQuery.empNo = ''
  operationQuery.moduleName = ''
  operationQuery.operationType = ''
  operationQuery.operationStatus = undefined
  operationDateRange.value = []
  fetchOperationLogs()
}

function resetTaskQuery() {
  taskQuery.page = 1
  taskQuery.size = 10
  taskQuery.taskId = ''
  taskQuery.stage = ''
  taskQuery.status = undefined
  taskDateRange.value = []
  fetchTaskLogs()
}

function handleLoginPageChange(page) {
  loginQuery.page = page
  fetchLoginLogs()
}

function handleLoginSizeChange(size) {
  loginQuery.size = size
  loginQuery.page = 1
  fetchLoginLogs()
}

function handleOperationPageChange(page) {
  operationQuery.page = page
  fetchOperationLogs()
}

function handleOperationSizeChange(size) {
  operationQuery.size = size
  operationQuery.page = 1
  fetchOperationLogs()
}

function handleTaskPageChange(page) {
  taskQuery.page = page
  fetchTaskLogs()
}

function handleTaskSizeChange(size) {
  taskQuery.size = size
  taskQuery.page = 1
  fetchTaskLogs()
}
</script>

<style scoped>
:deep(.el-tabs__content) {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
</style>