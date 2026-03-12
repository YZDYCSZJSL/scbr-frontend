<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
    <!-- 顶栏操作区 -->
    <div class="flex flex-col xl:flex-row justify-between gap-6 mb-6">
      <div class="flex items-center space-x-3 shrink-0">
        <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <el-icon :size="20"><User /></el-icon>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">教师管理</h2>
          <p class="text-xs text-gray-500 mt-1">管理教师信息</p>
        </div>
      </div>
      
      <div class="flex items-center gap-3 flex-nowrap overflow-x-auto pb-1 shrink-0">
        <el-input 
          v-model="queryParams.keyword" 
          placeholder="搜索姓名 / 工号 / 部门" 
          clearable
          size="large"
          class="w-64"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="queryParams.role" placeholder="账户角色" clearable size="large" class="w-32" @change="handleSearch">
          <el-option label="所有角色" value="" />
          <el-option label="普通教师" :value="0" />
          <el-option label="超级管理员" :value="1" />
        </el-select>
        <el-select v-model="queryParams.status" placeholder="状态" clearable size="large" class="w-28" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="正常" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        
        <div class="flex items-center gap-3">
          <el-button type="primary" size="large" class="px-5 font-medium shadow-sm shadow-blue-500/30 transition-transform hover:-translate-y-0.5" @click="handleSearch">
            <el-icon class="mr-1"><Search /></el-icon>查询
          </el-button>
          <el-button type="success" size="large" class="px-5 font-medium shadow-sm transition-transform hover:-translate-y-0.5" @click="handleAdd">
            <el-icon class="mr-1"><Plus /></el-icon>新增教师
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
        <el-table-column prop="emp_no" label="教师工号(账号)" width="140" fixed>
          <template #default="{ row }">
            <span class="font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded text-xs border border-gray-100">{{ row.emp_no }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="姓名" width="140" fixed>
          <template #default="{ row }">
            <div class="flex items-center space-x-2">
              <el-avatar :size="28" :class="row.role === 1 ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'" class="shadow-sm font-bold text-sm">
                {{ row.name.charAt(0) }}
              </el-avatar>
              <span class="font-medium text-gray-800">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="department" label="所属教学部门" width="160" show-overflow-tooltip />
        <el-table-column prop="phone" label="联系电话" width="140" />
        
        <el-table-column label="角色权限" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="row.role === 1 ? 'danger' : 'info'" effect="light" class="!border-none !rounded-full font-medium" size="small">
              <div class="flex items-center space-x-1">
                <el-icon v-if="row.role === 1"><Star /></el-icon>
                <span>{{ row.role === 1 ? '超级管理员' : '普通教师' }}</span>
              </div>
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="账号状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              inline-prompt
              active-text="正常"
              inactive-text="禁用"
              class="custom-switch"
              @change="(val) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="录入时间" width="160" />

        <el-table-column label="操作" fixed="right" min-width="150" align="center">
          <template #default="scope">
            <el-button link type="primary" size="small" class="font-medium hover:text-blue-700 transition-colors" @click="handleEdit(scope.row)">
              <el-icon class="mr-1"><Edit /></el-icon>编辑
            </el-button>
            <el-divider direction="vertical" />
            <el-popconfirm
              title="确定要删除此教师数据吗？该操作不可逆，且可能导致相关排课信息异常！"
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
      :title="dialogType === 'add' ? '新增教师记录' : '编辑教师信息'"
      width="500px"
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
          <el-form-item label="登录账号" prop="emp_no">
            <el-input v-model="formData.emp_no" placeholder="输入教师工号（如T2026001）" maxlength="20" show-word-limit />
          </el-form-item>
          <el-form-item label="登录密码" prop="password" :rules="dialogType === 'add' ? rules.password : []">
            <el-input 
              v-model="formData.password" 
              type="password" 
              show-password 
              :placeholder="dialogType === 'add' ? '请设置初始登录密码' : '不修改请留空'" 
              maxlength="32" 
            />
          </el-form-item>
          <el-form-item label="教师姓名" prop="name">
            <el-input v-model="formData.name" placeholder="请输入真实姓名" maxlength="20" />
          </el-form-item>
          <el-form-item label="所属部门" prop="department">
            <el-select v-model="formData.department" placeholder="请选择或输入" allow-create filterable class="w-full">
              <el-option label="计算机学院" value="计算机学院" />
              <el-option label="理学院" value="理学院" />
              <el-option label="外语学院" value="外语学院" />
              <el-option label="信息中心" value="信息中心" />
            </el-select>
          </el-form-item>
          <el-form-item label="联系电话" prop="phone">
            <el-input v-model="formData.phone" placeholder="请输入有效手机号码" maxlength="11" />
          </el-form-item>
          <el-form-item label="角色权限" prop="role">
            <el-radio-group v-model="formData.role">
              <el-radio-button :label="0">普通教师</el-radio-button>
              <el-radio-button :label="1">超级管理员</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="账号状态" prop="status">
            <el-switch
              v-model="formData.status"
              :active-value="1"
              :inactive-value="0"
              inline-prompt
              active-text="启用"
              inactive-text="禁用"
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Search, Plus, Edit, Delete, User, Star, Warning } from '@element-plus/icons-vue'
import request from '@/utils/request'

// --- 状态及分页检索 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const queryParams = reactive({
  keyword: '',
  role: '',
  status: '',
  page: 1,
  size: 10
})

// === 真实 API 对接 ===
const fetchData = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/admin/teacher/page',
      method: 'get',
      params: {
        page: queryParams.page,
        size: queryParams.size,
        keyword: queryParams.keyword || undefined,
        role: queryParams.role === '' ? undefined : queryParams.role,
        status: queryParams.status === '' ? undefined : queryParams.status
      }
    })
    
    // Axios 拦截器已经直接返回 data 层
    tableData.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取教师列表失败', error)
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
      url: `/admin/teacher/status/${row.id}`,
      method: 'put',
      data: { status: val } // 根据文档，也可以放在 body 里，具体看后端怎么接
    })
    ElMessage.success({ message: `账号状态已更新为：${val === 1 ? '正常' : '禁用'}`, grouping: true })
  } catch (error) {
    // 恢复原来的状态
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
  emp_no: '',
  password: '',
  name: '',
  department: '',
  phone: '',
  role: 0,
  status: 1
})

// 改成 computed 以响应 dialogType 的变化
const rules = computed(() => {
  return {
    emp_no: [
      { required: true, message: '必须填写登录账号(工号)', trigger: 'blur' },
      { pattern: /^[A-Za-z0-9_]+$/, message: '账号只能包含字母数字或下划线', trigger: 'blur' }
    ],
    password: [
      { required: dialogType.value === 'add', message: '新增账号时必须设置初始密码', trigger: 'blur' },
      { min: 6, max: 20, message: '密码长度需在 6 到 20 个字符之间', trigger: 'blur' }
    ],
    name: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
    department: [{ required: true, message: '请指定部门', trigger: 'change' }],
    phone: [
      { pattern: /^1[3-9]\d{9}$/, message: '手机号格式有误，请填写 11 位有效手机号', trigger: 'blur' }
    ]
  }
})

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields()
  Object.assign(formData, { id: null, emp_no: '', password: '', name: '', department: '', phone: '', role: 0, status: 1 })
}

const handleAdd = () => {
  dialogType.value = 'add'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  resetForm()
  Object.assign(formData, { ...row }) // 浅拷贝回显
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  loading.value = true
  try {
    await request({
      url: `/admin/teacher/${row.id}`,
      method: 'delete'
    })
    ElNotification({
      title: '删除成功',
      message: `已成功删除教师：${row.name} (${row.emp_no})`,
      type: 'success',
    })
    // 如果当前页只有一条数据，删除后回到上一页
    if (tableData.value.length === 1 && queryParams.page > 1) {
      queryParams.page -= 1
    }
    fetchData()
  } catch (error) {
    console.error('删除教师失败', error)
    loading.value = false // fetchData 在失败时不会被调用，所以此处手动重置
  }
}

const handleSubmit = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      
      try {
        if (dialogType.value === 'add') {
          await request({
            url: '/admin/teacher',
            method: 'post',
            data: formData
          })
          ElMessage.success('教师添加成功！')
        } else {
          // 编辑时不传 password 字段，后端保留原密码
          const updateData = { ...formData }
          if (!updateData.password) {
            delete updateData.password
          }
          await request({
            url: '/admin/teacher',
            method: 'put',
            data: updateData
          })
          ElMessage.success('保存修改成功！')
        }
        
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('保存教师信息失败', error)
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
/* 自定义深度样式覆写 */
:deep(.custom-switch .el-switch__core) {
  border-radius: 9999px;
}
:deep(.el-radio-button__inner) {
  padding: 8px 20px;
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
