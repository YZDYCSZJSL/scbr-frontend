<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
    <!-- 顶栏 (类似参考图样式) -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center gap-4 shrink-0 overflow-x-auto whitespace-nowrap mb-4">
      <!-- 左侧：图标与标题 -->
      <div class="flex items-center gap-4 shrink-0">
        <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <el-icon :size="24"><Calendar /></el-icon>
        </div>
        <div class="flex flex-col">
          <span class="text-[17px] font-bold text-gray-800 tracking-wide">排课管理</span>
          <span class="text-[12px] text-gray-400 mt-1">统筹课程、教师与教室安排</span>
        </div>
      </div>

      <!-- 右侧：无标签内联搜索区 -->
      <div class="flex items-center gap-3 shrink-0">
        <el-select
          v-model="selectedSearchSemesterConfigId"
          placeholder="学年学期"
          clearable
          class="w-32"
          @change="handleSearchSemesterChange"
          @clear="handleSearchSemesterClear"
        >
          <el-option
            v-for="item in semesterOptions"
            :key="item.id"
            :label="item.label"
            :value="item.id"
          />
        </el-select>

        <el-select
          v-model="queryParams.weekday"
          placeholder="星期"
          clearable
          class="w-24"
        >
          <el-option label="周一" :value="1" />
          <el-option label="周二" :value="2" />
          <el-option label="周三" :value="3" />
          <el-option label="周四" :value="4" />
          <el-option label="周五" :value="5" />
          <el-option label="周六" :value="6" />
          <el-option label="周日" :value="7" />
        </el-select>

        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索课程/教师"
          clearable
          class="w-40"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-button type="primary" color="#409eff" class="px-5 font-medium ml-1" @click="handleSearch">
          <el-icon class="mr-1"><Search /></el-icon>查询
        </el-button>

        <el-button
          plain
          class="px-4 font-medium"
          @click="switchViewMode(viewMode === 'list' ? 'week' : 'list')"
        >
          <el-icon class="mr-1">
            <component :is="viewMode === 'list' ? 'Grid' : 'Calendar'" />
          </el-icon>
          {{ viewMode === 'list' ? '切换周视图' : '切换列表视图' }}
        </el-button>

        <el-button
          color="#67c23a"
          type="success"
          class="px-5 font-medium shadow-sm ml-1"
          @click="handleAdd"
        >
          <el-icon class="mr-1"><Plus /></el-icon>新增排课
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
   <!-- 数据展示区 -->
<div class="flex-1 overflow-hidden rounded-lg border border-gray-100">
  <!-- 列表视图 -->
  <div v-if="viewMode === 'list'" class="h-full">
    <el-table 
      v-loading="loading" 
      :data="tableData" 
      style="width: 100%" 
      height="100%"
      stripe
      :header-cell-style="{ background: '#f8fafc', color: '#475569', fontWeight: 'bold' }"
    >
      <el-table-column prop="courseName" label="排课课程" min-width="160" show-overflow-tooltip fixed>
        <template #default="{ row }">
          <span class="font-bold text-gray-800">{{ row.courseName }}</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="teacherName" label="授课教师" width="120">
        <template #default="{ row }">
          <div class="flex items-center space-x-2">
            <el-avatar :size="24" class="bg-blue-100 text-blue-700 text-xs font-bold">{{ row.teacherName?.charAt(0) }}</el-avatar>
            <span class="font-medium text-gray-700">{{ row.teacherName }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="classroomName" label="上课地点" width="160" show-overflow-tooltip>
        <template #default="{ row }">
          <div class="flex items-center text-gray-600">
            <el-icon class="mr-1 text-orange-400"><Location /></el-icon>
            {{ row.classroomName }}
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="studentCount" label="应到人数" width="100" align="center">
        <template #default="{ row }">
          <span class="text-gray-600 font-bold">{{ row.studentCount }} 人</span>
        </template>
      </el-table-column>

      <el-table-column label="星期" width="90" align="center">
        <template #default="{ row }">
          <span class="font-medium text-gray-700">{{ formatWeekday(row.weekday) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="节次" width="110" align="center">
        <template #default="{ row }">
          <span class="text-gray-700 font-medium">
            第{{ row.startSectionNo }}-{{ row.endSectionNo }}节
          </span>
        </template>
      </el-table-column>

      <el-table-column label="时间段" width="160" align="center">
        <template #default="{ row }">
          <div class="flex items-center text-xs text-gray-500 justify-center bg-gray-50 px-2 py-1 rounded border border-gray-100 font-mono">
            <el-icon class="mr-1"><Clock /></el-icon>
            {{ row.startSectionTime }} <span class="mx-1 text-gray-300">~</span> {{ row.endSectionTime }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="周次" width="150" align="center">
        <template #default="{ row }">
          <span class="text-gray-700 font-medium">
            {{ row.startWeek }}-{{ row.endWeek }}周 / {{ formatWeekType(row.weekType) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="操作" fixed="right" min-width="240" align="center">
        <template #default="scope">
          <div class="flex items-center justify-center gap-3">
            <el-button
              link
              type="success"
              size="small"
              class="!m-0 font-medium hover:text-green-700 transition-colors"
              @click="handleGoAnalysis(scope.row)"
            >
              <el-icon class="mr-1"><DataAnalysis /></el-icon>去分析
            </el-button>

            <el-button
              link
              type="primary"
              size="small"
              class="!m-0 font-medium hover:text-blue-700 transition-colors"
              @click="handleEdit(scope.row)"
            >
              <el-icon class="mr-1"><Edit /></el-icon>修改
            </el-button>

            <el-popconfirm
              title="确定要取消并删除该排课计划吗？"
              confirm-button-text="确认取消"
              cancel-button-text="暂不"
              confirm-button-type="danger"
              width="240"
              icon="Warning"
              icon-color="#ef4444"
              @confirm="handleDelete(scope.row)"
            >
              <template #reference>
                <el-button link type="danger" size="small" class="!m-0 font-medium hover:text-red-700 transition-colors">
                  <el-icon class="mr-1"><Delete /></el-icon>取消
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <!-- 周视图 -->
  <div v-else v-loading="weekViewLoading" class="h-full overflow-auto bg-slate-50 p-4">
    <div v-if="!queryParams.academicYear || !queryParams.semester" class="h-full flex items-center justify-center text-gray-400 text-sm">
      请先选择学年学期，再切换到周视图
    </div>

    <div v-else class="min-w-[980px]">
      <!-- 表头 -->
      <div class="grid grid-cols-8 border border-gray-200 bg-white rounded-t-lg overflow-hidden">
        <div class="p-3 text-center font-bold text-gray-700 bg-slate-100 border-r border-gray-200">
          节次 / 星期
        </div>
        <div
          v-for="day in weekDays"
          :key="day.value"
          class="p-3 text-center font-bold text-gray-700 border-r last:border-r-0 border-gray-200 bg-slate-100"
        >
          {{ day.label }}
        </div>
      </div>

      <!-- 内容 -->
      <div
        v-for="section in sectionList"
        :key="section.id"
        class="grid grid-cols-8 border-x border-b border-gray-200 bg-white"
      >
        <div class="p-3 border-r border-gray-200 bg-slate-50">
          <div class="font-semibold text-gray-700">{{ section.sectionName }}</div>
          <div class="text-xs text-gray-400 mt-1">{{ section.startTime }} ~ {{ section.endTime }}</div>
        </div>

        <div
          v-for="day in weekDays"
          :key="`${section.id}-${day.value}`"
          class="min-h-[110px] border-r last:border-r-0 border-gray-200 p-2"
        >
        <div
            v-for="item in getWeekCellCoursesByStart(day.value, section.sectionNo)"
          :key="item.id"
            class="mb-2 rounded-lg border border-blue-200 bg-blue-50 p-2 shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
            @click="openWeekCourseActions(item)"
          >
            <div class="font-bold text-blue-800 text-sm truncate">{{ item.courseName }}</div>
            <div class="text-xs text-gray-600 mt-1">{{ item.teacherName }}</div>
            <div class="text-xs text-gray-500">{{ item.classroomName }}</div>
            <div class="text-xs text-gray-400 mt-1">
              第{{ item.startSectionNo }}-{{ item.endSectionNo }}节
            </div>
            <div class="text-xs text-gray-400">
              {{ item.startWeek }}-{{ item.endWeek }}周 / {{ formatWeekType(item.weekType) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

    <!-- 分页器 -->
    <div v-if="viewMode === 'list'" class="mt-5 flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
      <div class="text-sm text-gray-500 font-medium ml-2">检索结果：<span class="text-blue-600 font-bold mx-1">{{ total }}</span>条数据</div>
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.size"
        :page-sizes="[10, 20, 50, 100]"
        layout="sizes, prev, pager, next, jumper"
        :total="total"
        background
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增排课计划' : '修改排课规则'"
      width="580px"
      destroy-on-close
      class="custom-dialog"
    >
      <div class="px-2 pt-4">
        <el-form 
          ref="formRef" 
          :model="formData" 
          :rules="rules" 
          label-width="100px" 
          class="custom-form"
          status-icon
        >
          <el-form-item label="授课教师" prop="teacherId">
            <el-select v-model="formData.teacherId" placeholder="请指派教师" filterable class="w-full">
              <el-option v-for="t in teacherList" :key="t.id" :label="t.name + ' (' + t.emp_no + ')'" :value="t.id" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="教学课程" prop="courseId">
            <el-select v-model="formData.courseId" placeholder="请选择课程" filterable class="w-full">
              <el-option v-for="c in courseList" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>
          
          <div class="grid grid-cols-2 gap-4">
            <el-form-item label="上课地点" prop="classroomId" class="col-span-2">
              <el-select v-model="formData.classroomId" placeholder="分配教室" filterable class="w-full">
                <el-option v-for="r in roomList" :key="r.id" :label="r.name" :value="r.id" />
              </el-select>
            </el-form-item>
          </div>
 <el-row :gutter="20">
  <el-col :span="12">
    <el-form-item label="学年学期" prop="academicYear">
      <el-select
        v-model="selectedFormSemesterConfigId"
        placeholder="请选择学年学期"
        style="width: 100%"
        @change="handleFormSemesterChange"
        @clear="handleFormSemesterClear"
        clearable
      >
        <el-option
          v-for="item in semesterOptions"
          :key="item.id"
          :label="item.label"
          :value="item.id"
        />
      </el-select>
    </el-form-item>
  </el-col>
  <el-col :span="12">
    <el-form-item label="星期" prop="weekday">
      <el-select v-model="formData.weekday" placeholder="请选择星期" style="width: 100%">
        <el-option label="周一" :value="1" />
        <el-option label="周二" :value="2" />
        <el-option label="周三" :value="3" />
        <el-option label="周四" :value="4" />
        <el-option label="周五" :value="5" />
        <el-option label="周六" :value="6" />
        <el-option label="周日" :value="7" />
      </el-select>
    </el-form-item>
  </el-col>
</el-row>         

<el-row :gutter="20">
  <el-col :span="8">
    <el-form-item label="开始节次" prop="startSectionId">
      <el-select v-model="formData.startSectionId" placeholder="请选择开始节次" style="width: 100%">
        <el-option
          v-for="item in sectionList"
          :key="item.id"
          :label="`${item.sectionName} (${item.startTime}-${item.endTime})`"
          :value="item.id"
        />
      </el-select>
    </el-form-item>
  </el-col>
  <el-col :span="8">
    <el-form-item label="结束节次" prop="endSectionId">
      <el-select v-model="formData.endSectionId" placeholder="请选择结束节次" style="width: 100%">
        <el-option
          v-for="item in sectionList"
          :key="item.id"
          :label="`${item.sectionName} (${item.startTime}-${item.endTime})`"
          :value="item.id"
        />
      </el-select>
    </el-form-item>
  </el-col>
  <el-col :span="8">
    <el-form-item label="周次类型" prop="weekType">
      <el-select v-model="formData.weekType" placeholder="请选择周次类型" style="width: 100%">
        <el-option label="全周" :value="0" />
        <el-option label="单周" :value="1" />
        <el-option label="双周" :value="2" />
      </el-select>
    </el-form-item>
  </el-col>
</el-row>
<el-row :gutter="20">
  <el-col :span="8">
    <el-form-item label="开始周" prop="startWeek">
      <el-input-number v-model="formData.startWeek" :min="1" :max="30" style="width: 100%" />
    </el-form-item>
  </el-col>
  <el-col :span="8">
    <el-form-item label="结束周" prop="endWeek">
      <el-input-number v-model="formData.endWeek" :min="1" :max="30" style="width: 100%" />
    </el-form-item>
  </el-col>
  <el-col :span="8">
    <el-form-item label="应到人数" prop="studentCount">
      <el-input-number v-model="formData.studentCount" :min="1" :max="300" style="width: 100%" />
    </el-form-item>
  </el-col>
</el-row>
<el-form-item label="备注">
  <el-input
    v-model="formData.remark"
    type="textarea"
    :rows="2"
    placeholder="请输入备注"
  />
</el-form-item>
          
          <el-alert
            v-if="conflictMsg"
            :title="conflictMsg"
            type="error"
            show-icon
            :closable="false"
            class="!mt-4 !py-3"
          />
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer flex justify-end space-x-3 pt-2">
          <el-button @click="dialogVisible = false" class="!px-6">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading" class="!px-6 shadow-md shadow-blue-500/30">
            {{ dialogType === 'add' ? '生成排课' : '保存修改' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog
  v-model="weekCourseActionVisible"
  title="排课操作"
  width="420px"
  destroy-on-close
>
  <div v-if="currentWeekCourse" class="space-y-3">
    <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div class="text-base font-bold text-gray-800">{{ currentWeekCourse.courseName }}</div>
      <div class="text-sm text-gray-600 mt-2">教师：{{ currentWeekCourse.teacherName }}</div>
      <div class="text-sm text-gray-600">教室：{{ currentWeekCourse.classroomName }}</div>
      <div class="text-sm text-gray-600">
        时间：{{ formatWeekday(currentWeekCourse.weekday) }} · 第{{ currentWeekCourse.startSectionNo }}-{{ currentWeekCourse.endSectionNo }}节
      </div>
      <div class="text-sm text-gray-600">
        周次：{{ currentWeekCourse.startWeek }}-{{ currentWeekCourse.endWeek }}周 / {{ formatWeekType(currentWeekCourse.weekType) }}
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <el-button type="success" @click="handleWeekGoAnalysis">
        <el-icon class="mr-1"><DataAnalysis /></el-icon>去分析
      </el-button>

      <el-button type="primary" @click="handleWeekEdit">
        <el-icon class="mr-1"><Edit /></el-icon>修改
      </el-button>

      <el-button type="danger" @click="handleWeekDelete">
        <el-icon class="mr-1"><Delete /></el-icon>删除
      </el-button>
    </div>
  </div>
</el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Plus, Edit, Delete, Calendar, Clock, Location, Warning, DataAnalysis, Grid } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { useRouter } from 'vue-router'

// --- 状态及分页检索 ---
const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const conflictMsg = ref('')

const viewMode = ref('list') // list | week
const weekViewLoading = ref(false)
const weekViewData = ref([])

const queryParams = reactive({
  academicYear: '',
  semester: '',
  weekday: '',
  teacherId: '',
  courseId: '',
  classroomId: '',
  keyword: '',
  page: 1,
  size: 10
})

// === 基础元数据下拉列表依赖字典 ===
const teacherList = ref([])
const courseList = ref([])
const roomList = ref([])
const sectionList = ref([])

const semesterOptions = ref([])
const selectedSearchSemesterConfigId = ref('')
const selectedFormSemesterConfigId = ref('')


const weekDays = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 }
]

const fetchDictionaries = async () => {
  try {
    const [tRes, cRes, rRes, sRes, semesterRes] = await Promise.all([
      request.get('/admin/teacher/page', { params: { page: 1, size: 1000, status: 1 } }),
      request.get('/admin/course/page', { params: { page: 1, size: 1000, status: 1 } }),
      request.get('/admin/classroom/page', { params: { page: 1, size: 1000, status: 1 } }),
      request.get('/admin/schedule/section-time/list'),
      request.get('/admin/semester-config/options')
    ])

    teacherList.value = tRes?.records || []
    courseList.value = cRes?.records || []
    roomList.value = rRes?.records || []
    sectionList.value = Array.isArray(sRes) ? sRes : (sRes?.records || [])
    semesterOptions.value = Array.isArray(semesterRes) ? semesterRes : (semesterRes?.records || [])
  } catch (error) {
    console.error('获取基础下拉列表数据失败', error)
  }
}

// === 真实 API 对接 (排课台账) ===
const fetchData = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/admin/schedule/page',
      method: 'get',
      params: {
        page: queryParams.page,
        size: queryParams.size,
        academicYear: queryParams.academicYear || undefined,
        semester: queryParams.semester || undefined,
        weekday: queryParams.weekday || undefined,
        teacherId: queryParams.teacherId || undefined,
        courseId: queryParams.courseId || undefined,
        classroomId: queryParams.classroomId || undefined,
        keyword: queryParams.keyword || undefined,
      }
    })
    
    tableData.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取排课列表失败', error)
  } finally {
    loading.value = false
  }
}

const fetchWeekView = async () => {
  if (!queryParams.academicYear || !queryParams.semester) {
    weekViewData.value = []
    return
  }

  weekViewLoading.value = true
  try {
    const res = await request({
      url: '/admin/schedule/week-view',
      method: 'get',
      params: {
        academicYear: queryParams.academicYear,
        semester: queryParams.semester
      }
    })

    weekViewData.value = Array.isArray(res) ? res : (res?.records || [])
  } catch (error) {
    console.error('获取周视图失败', error)
    ElMessage.error(error.message || '获取周视图失败')
    weekViewData.value = []
  } finally {
    weekViewLoading.value = false
  }
}

const switchViewMode = async (mode) => {
  if (mode === 'week') {
    if (!queryParams.academicYear || !queryParams.semester) {
      ElMessage.warning('请先选择学年学期')
      return
    }
    viewMode.value = 'week'
    await fetchWeekView()
    return
  }

  viewMode.value = 'list'
}

const getWeekCellCoursesByStart = (weekday, sectionNo) => {
  return weekViewData.value.filter(item => {
    return Number(item.weekday) === Number(weekday)
      && Number(item.startSectionNo) === Number(sectionNo)
  })
}

const handleSearch = () => {
  queryParams.page = 1
  if (viewMode.value === 'week') {
    fetchWeekView()
  } else {
    fetchData()
  }
}


const handleSearchSemesterChange = (id) => {
  const selected = semesterOptions.value.find(item => item.id === id)
  if (!selected) return
  queryParams.academicYear = selected.academicYear
  queryParams.semester = selected.semester

  if (viewMode.value === 'week') {
    fetchWeekView()
  }
}

const handleSearchSemesterClear = () => {
  queryParams.academicYear = ''
  queryParams.semester = ''
  if (viewMode.value === 'week') {
    weekViewData.value = []
  }
}

const handleFormSemesterChange = (id) => {
  const selected = semesterOptions.value.find(item => item.id === id)
  if (!selected) return
  formData.academicYear = selected.academicYear
  formData.semester = selected.semester
}

const handleFormSemesterClear = () => {
  formData.academicYear = ''
  formData.semester = ''
}


// --- 对话框表单管理 ---
const dialogVisible = ref(false)
const dialogType = ref('add') // 'add' or 'edit'
const submitLoading = ref(false)
const formRef = ref(null)

const weekCourseActionVisible = ref(false)
const currentWeekCourse = ref(null)

const formData = reactive({
  id: null,
  academicYear: '',
  semester: '',
  courseId: '',
  teacherId: '',
  classroomId: '',
  weekday: '',
  startSectionId: '',
  endSectionId: '',
  startWeek: 1,
  endWeek: 16,
  weekType: 0,
  studentCount: 50,
  remark: ''
})

const rules = reactive({
  academicYear: [{ required: true, message: '请选择学年学期', trigger: 'change' }],
  semester: [{ required: true, message: '请选择学年学期', trigger: 'change' }],
  teacherId: [{ required: true, message: '请指定授课教师', trigger: 'change' }],
  courseId: [{ required: true, message: '请选择相关课程', trigger: 'change' }],
  classroomId: [{ required: true, message: '请分配物理教室', trigger: 'change' }],
  weekday: [{ required: true, message: '请选择星期', trigger: 'change' }],
  startSectionId: [{ required: true, message: '请选择开始节次', trigger: 'change' }],
  endSectionId: [{ required: true, message: '请选择结束节次', trigger: 'change' }],
  startWeek: [{ required: true, message: '请输入开始周', trigger: 'blur' }],
  endWeek: [{ required: true, message: '请输入结束周', trigger: 'blur' }],
  weekType: [{ required: true, message: '请选择周次类型', trigger: 'change' }],
  studentCount: [{ required: true, message: '必须规定应到人数', trigger: 'blur' }]
})

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields()
  conflictMsg.value = ''
  selectedFormSemesterConfigId.value = ''
  Object.assign(formData, {
    id: null,
    academicYear: '',
    semester: '',
    courseId: '',
    teacherId: '',
    classroomId: '',
    weekday: '',
    startSectionId: '',
    endSectionId: '',
    startWeek: 1,
    endWeek: 16,
    weekType: 0,
    studentCount: 50,
    remark: ''
  })
}

const handleAdd = () => {
  dialogType.value = 'add'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  resetForm()
  Object.assign(formData, {
    id: row.id,
    academicYear: row.academicYear,
    semester: row.semester,
    teacherId: row.teacherId,
    courseId: row.courseId,
    classroomId: row.classroomId,
    weekday: row.weekday,
    startSectionId: row.startSectionId,
    endSectionId: row.endSectionId,
    startWeek: row.startWeek,
    endWeek: row.endWeek,
    weekType: row.weekType,
    studentCount: row.studentCount,
    remark: row.remark || ''
  })
  const matchedSemester = semesterOptions.value.find(
  item => item.academicYear === row.academicYear && item.semester === row.semester
)
selectedFormSemesterConfigId.value = matchedSemester ? matchedSemester.id : ''
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  loading.value = true
  try {
    await request({
      url: `/admin/schedule/${row.id}`,
      method: 'delete'
    })
    ElMessage.success('该排课记录已取消并移除。')

    if (viewMode.value === 'list') {
      if (tableData.value.length === 1 && queryParams.page > 1) {
        queryParams.page -= 1
      }
      fetchData()
    } else {
      fetchWeekView()
    }
  } catch (error) {
    console.error('删除排课失败', error)
    ElMessage.error(error.message || '删除排课失败')
  } finally {
    loading.value = false
  }
}

const openWeekCourseActions = (item) => {
  currentWeekCourse.value = item
  weekCourseActionVisible.value = true
}

const handleWeekEdit = () => {
  if (!currentWeekCourse.value) return
  weekCourseActionVisible.value = false
  handleEdit(currentWeekCourse.value)
}

const handleWeekGoAnalysis = () => {
  if (!currentWeekCourse.value) return
  weekCourseActionVisible.value = false
  handleGoAnalysis(currentWeekCourse.value)
}

const handleWeekDelete = async () => {
  if (!currentWeekCourse.value) return
  weekCourseActionVisible.value = false
  await handleDelete(currentWeekCourse.value)
}

const fetchAnalysisInit = async (scheduleId) => {
  return await request({
    url: `/admin/schedule/${scheduleId}/analysis-init`,
    method: 'get'
  })
}

const handleGoAnalysis = async (row) => {
  try {
    const analysisInit = await fetchAnalysisInit(row.id)

    // 先把后端返回的预填信息缓存起来，供分析页面读取
    sessionStorage.setItem('scheduleAnalysisInit', JSON.stringify(analysisInit))

    ElMessage.success('已带入排课信息，正在跳转到分析页面')

    router.push({
      path: '/dashboard',
      query: {
        scheduleId: analysisInit.scheduleId || row.id,
        from: 'schedule',
        prefill: '1'
      }
    })
  } catch (error) {
    console.error('获取分析预填信息失败', error)
    ElMessage.error(error.message || '获取分析预填信息失败')
  }
}

// 防冲突逻辑及提交
const handleSubmit = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      conflictMsg.value = ''
      
      const payload = {
        academicYear: formData.academicYear,
        semester: formData.semester,
        courseId: formData.courseId,
        classroomId: formData.classroomId,
        teacherId: formData.teacherId,
        weekday: formData.weekday,
        startSectionId: formData.startSectionId,
        endSectionId: formData.endSectionId,
        startWeek: formData.startWeek,
        endWeek: formData.endWeek,
        weekType: formData.weekType,
        studentCount: formData.studentCount,
        remark: formData.remark
      }
      if (Number(formData.startSectionId) > Number(formData.endSectionId)) {
        ElMessage.error('开始节次不能大于结束节次')
        submitLoading.value = false
        return
      }

      if (Number(formData.startWeek) > Number(formData.endWeek)) {
        ElMessage.error('开始周不能大于结束周')
        submitLoading.value = false
        return
      }
      if (formData.id) {
        payload.id = formData.id
      }
      
      try {
        if (dialogType.value === 'add') {
          await request({
            url: '/admin/schedule',
            method: 'post',
            data: payload
          })
          ElMessage.success('排课计划生成成功。')
        } else {
          payload.id = formData.id
          await request({
            url: '/admin/schedule',
            method: 'put',
            data: payload
          })
          ElMessage.success('修改排课规则成功！')
        }
        
        dialogVisible.value = false
        if (viewMode.value === 'week') {
          fetchWeekView()
        } else {
          fetchData()
        }
      } catch (error) {
        console.error('保存排课信息失败', error)
        // 后端通常会在 message 字段中带出冲突信息
        // 由于我们在 request.js 的响应拦截中已经 Promise.reject(new Error(res.message))
        conflictMsg.value = error.message || '排课规则或资源存在冲突，保存失败'
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const formatWeekday = (weekday) => {
  const map = {
    1: '周一',
    2: '周二',
    3: '周三',
    4: '周四',
    5: '周五',
    6: '周六',
    7: '周日'
  }
  return map[weekday] || '-'
}

const formatWeekType = (weekType) => {
  const map = {
    0: '全周',
    1: '单周',
    2: '双周'
  }
  return map[weekType] || '-'
}

onMounted(async () => {
  // 正常流程：需要先并行 fetch 字典数据 (teachers, courses, classrooms)，再 fetch 列表
  await fetchDictionaries()
  fetchData()
})
</script>

<style scoped>
:deep(.custom-dialog .el-dialog__header) {
  padding: 20px 24px 0;
  margin-right: 0;
}
:deep(.custom-dialog .el-dialog__title) {
  font-weight: 700;
  color: #1f2937;
}
:deep(.custom-form .el-form-item__label) {
  font-weight: 600;
  color: #4b5563;
}
:deep(.drag-uploader .el-upload) {
  width: 100%;
}
:deep(.drag-uploader .el-upload-dragger) {
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
  padding: 0;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  overflow: hidden;
}
:deep(.drag-uploader .el-upload-dragger:hover) {
  border-color: #3b82f6;
  background-color: #eff6ff;
}
:deep(.drag-uploader .el-icon--upload) {
  font-size: 36px;
  margin-bottom: 8px;
  line-height: 1;
}
</style>
