<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
    <!-- 顶栏操作区 -->
    <div class="flex flex-col xl:flex-row justify-between gap-6 mb-6">
      <div class="flex items-center space-x-3 shrink-0">
        <div class="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          <el-icon :size="20"><Reading /></el-icon>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">课程管理</h2>
          <p class="text-xs text-gray-500 mt-1">管理系统课程基本信息</p>
        </div>
      </div>
      
      <!-- 搜索与新增按钮同一行 -->
      <div class="flex items-center gap-3 flex-nowrap overflow-x-auto pb-1 shrink-0">
        <el-input 
          v-model="queryParams.keyword" 
          placeholder="搜索课程编号 / 名称 / 部门" 
          clearable
          size="large"
          class="w-64"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="queryParams.status" placeholder="状态" clearable size="large" class="w-32" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="正常" :value="1" />
          <el-option label="停课" :value="0" />
        </el-select>
        
        <div class="flex items-center gap-3 shrink-0">
          <el-button type="primary" size="large" class="px-5 font-medium shadow-sm shadow-blue-500/30 transition-transform hover:-translate-y-0.5" @click="handleSearch">
            <el-icon class="mr-1"><Search /></el-icon>查询
          </el-button>
          <el-button type="success" size="large" class="px-5 font-medium shadow-sm transition-transform hover:-translate-y-0.5" @click="handleAdd">
            <el-icon class="mr-1"><Plus /></el-icon>新增课程
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
        <!-- 移除了原有的序号列 -->
        
        <el-table-column prop="course_no" label="课程编号" width="140" fixed>
          <template #default="{ row }">
            <span class="font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs border border-emerald-100 font-bold">{{ row.course_no }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="课程名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-medium text-gray-800">{{ row.name }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="department" label="所属教学部门" width="160" show-overflow-tooltip />
        
        <el-table-column prop="hours" label="总学时" width="100" align="center">
          <template #default="{ row }">
            <span class="text-gray-600"><span class="font-bold text-gray-800">{{ row.hours }}</span> 学时</span>
          </template>
        </el-table-column>
        
        <!-- Remove outline_url table column -->
        <el-table-column label="课程状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              inline-prompt
              active-text="正常"
              inactive-text="停课"
              class="custom-switch"
              @change="(val) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="160" />

        <el-table-column label="操作" fixed="right" min-width="150" align="center">
          <template #default="scope">
            <el-button link type="primary" size="small" class="font-medium hover:text-blue-700 transition-colors" @click="handleEdit(scope.row)">
              <el-icon class="mr-1"><Edit /></el-icon>编辑
            </el-button>
            <el-divider direction="vertical" />
            <el-popconfirm
              title="确定要删除此课程数据吗？排课数据可能会受到影响！"
              confirm-button-text="确认删除"
              cancel-button-text="取消"
              confirm-button-type="danger"
              width="240"
              icon="Warning"
              icon-color="#ef4444"
              @confirm="handleDelete(scope.row)"
            >
              <template #reference>
                <el-button link type="danger" size="small" class="font-medium hover:text-red-700 transition-colors">
                  <el-icon class="mr-1"><Delete /></el-icon>删除
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
      :title="dialogType === 'add' ? '新增课程' : '编辑课程信息'"
      width="550px"
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
          <el-form-item label="课程编号" prop="course_no">
            <el-input v-model="formData.course_no" :disabled="dialogType === 'edit'" placeholder="例如：C001" maxlength="20" show-word-limit />
          </el-form-item>
          <el-form-item label="课程名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入课程全称" maxlength="50" />
          </el-form-item>
          <el-form-item label="所属部门" prop="department">
            <el-select v-model="formData.department" placeholder="请选择或输入" allow-create filterable class="w-full">
              <el-option label="计算机学院" value="计算机学院" />
              <el-option label="理学院" value="理学院" />
              <el-option label="外语学院" value="外语学院" />
              <el-option label="公共选修" value="公共选修" />
            </el-select>
          </el-form-item>
          <el-form-item label="课程学时" prop="hours">
            <el-input-number v-model="formData.hours" :min="1" :max="200" class="!w-full" placeholder="总课时规划" />
          </el-form-item>
          <el-form-item label="课程状态" prop="status">
            <el-switch
              v-model="formData.status"
              :active-value="1"
              :inactive-value="0"
              inline-prompt
              active-text="正常"
              inactive-text="停课"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer flex justify-end space-x-3 pt-2">
          <el-button @click="dialogVisible = false" class="!px-6">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading" class="!px-6 shadow-md shadow-blue-500/30">
            {{ dialogType === 'add' ? '立即创建' : '保存修改' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Search, Plus, Edit, Delete, Reading, Document, Warning } from '@element-plus/icons-vue'
import request from '@/utils/request'

// --- 状态及分页检索 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const queryParams = reactive({
  keyword: '',
  status: '',
  page: 1,
  size: 10
})

// === 真实 API 对接 ===
const fetchData = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/admin/course/page',
      method: 'get',
      params: {
        page: queryParams.page,
        size: queryParams.size,
        keyword: queryParams.keyword || undefined,
        status: queryParams.status === '' ? undefined : queryParams.status
      }
    })
    
    tableData.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取课程列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  fetchData()
}

// --- 开关状态修改 ---
const handleStatusChange = async (row, val) => {
  try {
    await request({
      url: '/admin/course', 
      method: 'put',
      data: {
        id: row.id,
        status: val
      }
    })
    ElMessage.success({ message: `课程状态已更新为：${val === 1 ? '正常' : '停课'}`, grouping: true })
  } catch (error) {
    row.status = val === 1 ? 0 : 1
    console.error('状态切换失败', error)
  }
}

// --- 对话框表单管理 ---
const dialogVisible = ref(false)
const dialogType = ref('add') // 'add' or 'edit'
const submitLoading = ref(false)
const formRef = ref(null)

const formData = reactive({
  id: null,
  course_no: '',
  name: '',
  department: '',
  hours: 32,
  status: 1
})

const rules = reactive({
  course_no: [
    { required: true, message: '必须填写课程编号', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_-]+$/, message: '编号只能包含字母数字横线', trigger: 'blur' }
  ],
  name: [{ required: true, message: '课程名称不能为空', trigger: 'blur' }],
  department: [{ required: true, message: '请指定部门', trigger: 'change' }],
  hours: [{ required: true, message: '学时必须填写', trigger: 'blur' }]
})

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields()
  Object.assign(formData, { id: null, course_no: '', name: '', department: '', hours: 32, status: 1 })
}

const handleAdd = () => {
  dialogType.value = 'add'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  resetForm()
  Object.assign(formData, { ...row })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  loading.value = true
  try {
    await request({
      url: `/admin/course/${row.id}`,
      method: 'delete'
    })
    ElNotification({
      title: '删除成功',
      message: `已移除课程：${row.name} (${row.course_no})`,
      type: 'success',
    })
    // 如果当前页只有一条数据，删除后回到上一页
    if (tableData.value.length === 1 && queryParams.page > 1) {
      queryParams.page -= 1
    }
    fetchData()
  } catch (error) {
    console.error('删除课程失败', error)
    loading.value = false 
  }
}

const handleSubmit = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      
      try {
        if (dialogType.value === 'add') {
          await request({
            url: '/admin/course', 
            method: 'post',
            data: {
              course_no: formData.course_no,
              name: formData.name,
              department: formData.department,
              hours: formData.hours,
              status: formData.status
            }
          })
          ElMessage.success('课程添加成功！')
        } else {
          await request({
            url: '/admin/course',
            method: 'put',
            data: {
              id: formData.id,
              course_no: formData.course_no,
              name: formData.name,
              department: formData.department,
              hours: formData.hours,
              status: formData.status
            }
          })
          ElMessage.success('保存修改成功！')
        }
        
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('保存课程信息失败', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
:deep(.custom-switch .el-switch__core) {
  border-radius: 9999px;
}
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
</style>
