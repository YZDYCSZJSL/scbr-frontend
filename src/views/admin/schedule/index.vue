<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
    <!-- 顶栏 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center gap-4 shrink-0 overflow-x-auto whitespace-nowrap mb-4">
      <div class="flex items-center gap-4 shrink-0">
        <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <el-icon :size="24"><Calendar /></el-icon>
        </div>
        <div class="flex flex-col">
          <span class="text-[17px] font-bold text-gray-800 tracking-wide">排课管理</span>
          <span class="text-[12px] text-gray-400 mt-1">统筹课程、教师与教室安排</span>
        </div>
      </div>

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

    <!-- 数据展示区 -->
    <div class="flex-1 overflow-hidden rounded-lg border border-gray-100">
      <!-- 列表视图 -->
      <ScheduleTable 
        v-if="viewMode === 'list'"
        :loading="loading"
        :tableData="tableData"
        @goAnalysis="handleGoAnalysis"
        @edit="handleEdit"
        @delete="handleDelete"
      />

      <!-- 周视图 -->
      <ScheduleWeekView 
        v-else
        :loading="weekViewLoading"
        :queryParams="queryParams"
        :sectionList="sectionList"
        :weekViewData="weekViewData"
        @openAction="openWeekCourseActions"
      />
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
    <ScheduleFormDialog 
      v-model="dialogVisible"
      :dialogType="dialogType"
      :formData="formData"
      :conflictMsg="conflictMsg"
      :submitLoading="submitLoading"
      :teacherList="teacherList"
      :courseList="courseList"
      :roomList="roomList"
      :sectionList="sectionList"
      :semesterOptions="semesterOptions"
      v-model:selectedFormSemesterConfigId="selectedFormSemesterConfigId"
      @semesterChange="handleFormSemesterChange"
      @semesterClear="handleFormSemesterClear"
      @submit="handleSubmit"
    />

    <!-- 周视图操作对话框 -->
    <WeekCourseActionDialog 
      v-model="weekCourseActionVisible"
      :currentWeekCourse="currentWeekCourse"
      @goAnalysis="handleWeekGoAnalysis"
      @edit="handleWeekEdit"
      @delete="handleWeekDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Plus, Calendar, Grid } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

import ScheduleTable from './components/ScheduleTable.vue'
import ScheduleWeekView from './components/ScheduleWeekView.vue'
import ScheduleFormDialog from './components/ScheduleFormDialog.vue'
import WeekCourseActionDialog from './components/WeekCourseActionDialog.vue'

import { 
  fetchTeacherOptions, fetchCourseOptions, fetchClassroomOptions, 
  fetchSectionTimeList, fetchSemesterOptions, fetchSchedulePage, 
  fetchScheduleWeekView, addSchedule, updateSchedule, 
  deleteSchedule, fetchAnalysisInit 
} from './api'

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

const teacherList = ref([])
const courseList = ref([])
const roomList = ref([])
const sectionList = ref([])

const semesterOptions = ref([])
const selectedSearchSemesterConfigId = ref('')
const selectedFormSemesterConfigId = ref('')

const fetchDictionaries = async () => {
  try {
    const [tRes, cRes, rRes, sRes, semesterRes] = await Promise.all([
      fetchTeacherOptions(),
      fetchCourseOptions(),
      fetchClassroomOptions(),
      fetchSectionTimeList(),
      fetchSemesterOptions()
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

const fetchData = async () => {
  loading.value = true
  try {
    const res = await fetchSchedulePage({
      page: queryParams.page,
      size: queryParams.size,
      academicYear: queryParams.academicYear || undefined,
      semester: queryParams.semester || undefined,
      weekday: queryParams.weekday || undefined,
      teacherId: queryParams.teacherId || undefined,
      courseId: queryParams.courseId || undefined,
      classroomId: queryParams.classroomId || undefined,
      keyword: queryParams.keyword || undefined,
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
    const res = await fetchScheduleWeekView({
      academicYear: queryParams.academicYear,
      semester: queryParams.semester
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

const dialogVisible = ref(false)
const dialogType = ref('add') 
const submitLoading = ref(false)

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

const resetForm = () => {
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
    await deleteSchedule(row.id)
    ElMessage.success('该排课记录已删除。')

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

const handleGoAnalysis = async (row) => {
  try {
    const analysisInit = await fetchAnalysisInit(row.id)

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

const handleSubmit = async () => {
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
  
  if (formData.id) payload.id = formData.id
  
  try {
    if (dialogType.value === 'add') {
      await addSchedule(payload)
      ElMessage.success('排课计划生成成功。')
    } else {
      payload.id = formData.id
      await updateSchedule(payload)
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
    conflictMsg.value = error.message || '排课规则或资源存在冲突，保存失败'
  } finally {
    submitLoading.value = false
  }
}

onMounted(async () => {
  await fetchDictionaries()
  fetchData()
})
</script>
