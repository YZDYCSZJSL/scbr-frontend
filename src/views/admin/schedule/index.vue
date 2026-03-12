<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
    <!-- 顶栏操作区 -->
    <div class="flex flex-col xl:flex-row justify-between gap-6 mb-6">
      <div class="flex items-center space-x-3 shrink-0">
        <div class="p-2 bg-purple-50 text-purple-600 rounded-lg">
          <el-icon :size="20"><Calendar /></el-icon>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">排课管理</h2>
          <p class="text-xs text-gray-500 mt-1">统筹课程、教师与教室安排</p>
        </div>
      </div>
      
      <!-- 搜索与操作按钮同一行 -->
      <div class="flex items-center gap-3 flex-nowrap overflow-x-auto pb-1 shrink-0">
        <el-select v-model="queryParams.teacherId" placeholder="按教师筛选" clearable filterable size="large" class="w-28" @change="handleSearch">
          <el-option v-for="t in teacherList" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
        <el-select v-model="queryParams.courseId" placeholder="按课程筛选" clearable filterable size="large" class="w-32" @change="handleSearch">
          <el-option v-for="c in courseList" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="queryParams.classroomId" placeholder="按教室筛选" clearable filterable size="large" class="w-28" @change="handleSearch">
          <el-option v-for="r in roomList" :key="r.id" :label="r.name" :value="r.id" />
        </el-select>
        <el-select v-model="queryParams.status" placeholder="状态" clearable size="large" class="w-24" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="未开始" :value="0" />
          <el-option label="进行中" :value="1" />
          <el-option label="已结束" :value="2" />
        </el-select>
        
        <div class="flex items-center gap-3 shrink-0">
          <el-button type="primary" size="large" class="px-5 font-medium shadow-sm shadow-blue-500/30 transition-transform hover:-translate-y-0.5" @click="handleSearch">
            <el-icon class="mr-1"><Search /></el-icon>查询
          </el-button>
          <el-button type="success" size="large" class="px-5 font-medium shadow-sm transition-transform hover:-translate-y-0.5" @click="handleAdd">
            <el-icon class="mr-1"><Plus /></el-icon>新增排课
          </el-button>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="flex-1 overflow-hidden rounded-lg border border-gray-100">
      <el-table 
        v-loading="loading" 
        :data="tableData" 
        style="width: 100%" 
        height="100%"
        stripe
        :header-cell-style="{ background: '#f8fafc', color: '#475569', fontWeight: 'bold' }"
      >
        <!-- 无序号列 -->

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

        <el-table-column label="上课时间" width="280" align="center">
          <template #default="{ row }">
            <div class="flex items-center text-xs text-gray-500 justify-center bg-gray-50 px-2 py-1 rounded border border-gray-100 font-mono">
              <el-icon class="mr-1"><Clock /></el-icon>
              {{ row.startTime }} <span class="mx-1 text-gray-300">~</span> {{ row.endTime.split(' ')[1] }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="课程状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="info" effect="light" class="!border-none font-medium text-xs">未开始</el-tag>
            <el-tag v-else-if="row.status === 1" type="success" effect="light" class="!border-none font-medium text-xs rounded-full px-3">
              <span class="flex items-center"><span class="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span>进行中</span>
            </el-tag>
            <el-tag v-else-if="row.status === 2" type="primary" effect="light" class="!border-none font-medium text-xs">已结束</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" min-width="150" align="center">
          <template #default="scope">
            <el-button 
              link type="primary" size="small" 
              class="font-medium hover:text-blue-700 transition-colors" 
              @click="handleEdit(scope.row)"
              :disabled="scope.row.status !== 0"
            >
              <el-icon class="mr-1"><Edit /></el-icon>修改
            </el-button>
            <el-divider direction="vertical" />
            <el-popconfirm
              title="确定要取消并删除该排课计划吗？"
              confirm-button-text="确认取消"
              cancel-button-text="暂不"
              confirm-button-type="danger"
              width="240"
              icon="Warning"
              icon-color="#ef4444"
              @confirm="handleDelete(scope.row)"
              :disabled="scope.row.status !== 0"
            >
              <template #reference>
                <el-button link type="danger" size="small" class="font-medium hover:text-red-700 transition-colors" :disabled="scope.row.status !== 0">
                  <el-icon class="mr-1"><Delete /></el-icon>取消
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页器 -->
    <div class="mt-5 flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
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
      :title="dialogType === 'add' ? '新增排课计划' : '修改排课时间'"
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
            <el-form-item label="上课地点" prop="classroomId" class="col-span-2 md:col-span-1">
              <el-select v-model="formData.classroomId" placeholder="分配教室" filterable class="w-full">
                <el-option v-for="r in roomList" :key="r.id" :label="r.name" :value="r.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="应到人数" prop="studentCount" class="col-span-2 md:col-span-1">
              <el-input-number v-model="formData.studentCount" :min="1" :max="500" class="!w-full" placeholder="例如：50" />
            </el-form-item>
          </div>
          
          <el-form-item label="排课时间" prop="timeRange">
            <el-date-picker
              v-model="formData.timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="上课时间"
              end-placeholder="下课时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="!w-full"
              :default-time="[new Date(2000, 1, 1, 8, 0, 0), new Date(2000, 1, 1, 9, 40, 0)]"
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Plus, Edit, Delete, Calendar, Clock, Location, Warning } from '@element-plus/icons-vue'
import request from '@/utils/request'

// --- 状态及分页检索 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const conflictMsg = ref('')

const queryParams = reactive({
  teacherId: '',
  courseId: '',
  classroomId: '',
  status: '',
  page: 1,
  size: 10
})

// === 基础元数据下拉列表依赖字典 ===
const teacherList = ref([])
const courseList = ref([])
const roomList = ref([])

const fetchDictionaries = async () => {
  try {
    // 采用 page=1, size=1000 的方式获取下拉选择数据 (或如果有全局的 /list 接口则更佳)
    const [tRes, cRes, rRes] = await Promise.all([
      request.get('/admin/teacher/page', { params: { page: 1, size: 1000, status: 1 } }),
      request.get('/admin/course/page', { params: { page: 1, size: 1000, status: 1 } }),
      request.get('/admin/classroom/page', { params: { page: 1, size: 1000, status: 1 } })
    ])
    teacherList.value = tRes?.records || []
    courseList.value = cRes?.records || []
    roomList.value = rRes?.records || []
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
        teacherId: queryParams.teacherId || undefined,
        courseId: queryParams.courseId || undefined,
        classroomId: queryParams.classroomId || undefined,
        status: queryParams.status === '' ? undefined : queryParams.status
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

const handleSearch = () => {
  queryParams.page = 1
  fetchData()
}

// --- 对话框表单管理 ---
const dialogVisible = ref(false)
const dialogType = ref('add') // 'add' or 'edit'
const submitLoading = ref(false)
const formRef = ref(null)

const formData = reactive({
  id: null,
  teacherId: '',
  courseId: '',
  classroomId: '',
  studentCount: 50,
  timeRange: [] // [startTime, endTime]
})

const rules = reactive({
  teacherId: [{ required: true, message: '请指定授课教师', trigger: 'change' }],
  courseId: [{ required: true, message: '请选择相关课程', trigger: 'change' }],
  classroomId: [{ required: true, message: '请分配物理教室', trigger: 'change' }],
  studentCount: [{ required: true, message: '必须规定应到人数', trigger: 'blur' }],
  timeRange: [{ required: true, message: '请规划上课及下课时间段', trigger: 'change' }]
})

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields()
  conflictMsg.value = ''
  Object.assign(formData, { id: null, teacherId: '', courseId: '', classroomId: '', studentCount: 50, timeRange: [] })
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
    id: row.id, teacherId: row.teacherId, courseId: row.courseId, classroomId: row.classroomId,
    studentCount: row.studentCount, timeRange: [row.startTime, row.endTime]
  })
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
    if (tableData.value.length === 1 && queryParams.page > 1) {
      queryParams.page -= 1
    }
    fetchData()
  } catch (error) {
    console.error('删除排课失败', error)
    loading.value = false
  }
}

// 防冲突逻辑及提交
const handleSubmit = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      conflictMsg.value = ''
      
      const payload = {
        courseId: formData.courseId,
        classroomId: formData.classroomId,
        teacherId: formData.teacherId,
        studentCount: formData.studentCount,
        startTime: formData.timeRange[0],
        endTime: formData.timeRange[1]
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
          ElMessage.success('修改排课时间成功！')
        }
        
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('保存排课信息失败', error)
        // 后端通常会在 message 字段中带出冲突信息
        // 由于我们在 request.js 的响应拦截中已经 Promise.reject(new Error(res.message))
        conflictMsg.value = error.message || '排课时间或资源存在冲突，保存失败'
      } finally {
        submitLoading.value = false
      }
    }
  })
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
