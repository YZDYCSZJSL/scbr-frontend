<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
    <!-- 顶栏操作区 -->
    <div class="flex flex-col xl:flex-row justify-between gap-6 mb-6">
      <div class="flex items-center space-x-3 shrink-0">
        <div class="p-2 bg-orange-50 text-orange-600 rounded-lg">
          <el-icon :size="20"><Location /></el-icon>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">教室管理</h2>
          <p class="text-xs text-gray-500 mt-1">管理校园物理空间</p>
        </div>
      </div>
      
      <!-- 搜索与新增按钮同一行 -->
      <div class="flex items-center gap-3 flex-nowrap overflow-x-auto pb-1 shrink-0">
        <el-input 
          v-model="queryParams.keyword" 
          placeholder="搜索编号 / 名称 / 位置" 
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
          <el-option label="可用" :value="1" />
          <el-option label="维护中" :value="0" />
        </el-select>
        
        <div class="flex items-center gap-3 shrink-0">
          <el-button type="primary" size="large" class="px-5 font-medium shadow-sm shadow-blue-500/30 transition-transform hover:-translate-y-0.5" @click="handleSearch">
            <el-icon class="mr-1"><Search /></el-icon>查询
          </el-button>
          <el-button type="success" size="large" class="px-5 font-medium shadow-sm transition-transform hover:-translate-y-0.5" @click="handleAdd">
            <el-icon class="mr-1"><Plus /></el-icon>新增教室
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

        <el-table-column prop="room_no" label="教室编号" width="130" fixed>
          <template #default="{ row }">
            <span class="font-mono text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs border border-orange-100 font-bold">{{ row.room_no }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="教室名称" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-medium text-gray-800">{{ row.name }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="location" label="具体位置" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="flex items-center text-gray-600">
              <el-icon class="mr-1 text-gray-400"><Place /></el-icon>
              {{ row.location }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="capacity" label="容纳人数" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="info" effect="plain" class="!border-gray-200">
              <el-icon class="mr-1"><UserFilled /></el-icon>
              <span class="font-bold">{{ row.capacity }}</span> 人
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="当前状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              inline-prompt
              active-text="可用"
              inactive-text="维护中"
              class="custom-switch"
              @change="(val) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" min-width="150" align="center">
          <template #default="scope">
            <el-button link type="primary" size="small" class="font-medium hover:text-blue-700 transition-colors" @click="handleEdit(scope.row)">
              <el-icon class="mr-1"><Edit /></el-icon>编辑
            </el-button>
            <el-divider direction="vertical" />
            <el-popconfirm
              title="确定要物理移除该教室吗？已被课程占用的教室无法删除！"
              confirm-button-text="确认移除"
              cancel-button-text="取消"
              confirm-button-type="danger"
              width="260"
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
      :title="dialogType === 'add' ? '新增物理教室' : '编辑教室设施'"
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
          <div class="grid grid-cols-2 gap-4">
            <el-form-item label="教室编号" prop="room_no" class="col-span-2 md:col-span-1">
              <el-input v-model="formData.room_no" :disabled="dialogType === 'edit'" placeholder="例如：A101" maxlength="20" show-word-limit />
            </el-form-item>
            <el-form-item label="容纳人数" prop="capacity" class="col-span-2 md:col-span-1">
              <el-input-number v-model="formData.capacity" :min="1" :max="500" class="!w-full" placeholder="例如：60" />
            </el-form-item>
          </div>
          
          <el-form-item label="教室名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入教室全命名（如：多媒体阶梯教室A101）" maxlength="50" />
          </el-form-item>
          <el-form-item label="具体位置" prop="location">
            <el-input v-model="formData.location" placeholder="例如：一号教学楼1楼东侧" maxlength="50">
              <template #prefix><el-icon><Place /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item label="当前状态" prop="status">
            <el-switch
              v-model="formData.status"
              :active-value="1"
              :inactive-value="0"
              inline-prompt
              active-text="可用"
              inactive-text="维护"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer flex justify-end space-x-3 pt-2">
          <el-button @click="dialogVisible = false" class="!px-6">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading" class="!px-6 shadow-md shadow-blue-500/30">
            {{ dialogType === 'add' ? '立即提交' : '保存修改' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Search, Plus, Edit, Delete, Location, Place, Warning, UserFilled } from '@element-plus/icons-vue'
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
      url: '/admin/classroom/page',
      method: 'get',
      params: {
        page: queryParams.page,
        size: queryParams.size,
        keyword: queryParams.keyword || undefined,
        status: queryParams.status === '' ? undefined : queryParams.status
      }
    })
    
    // Axios 拦截器已经直接返回 data 层
    tableData.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取教室列表失败', error)
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
      url: '/admin/classroom', // 这里根据文档 PUT /admin/classroom 也可以用于修改状态
      method: 'put',
      data: {
        id: row.id,
        status: val
      }
    })
    ElMessage.success({ message: `教室状态已更新为：${val === 1 ? '可用' : '维护中'}`, grouping: true })
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
  room_no: '',
  name: '',
  location: '',
  capacity: 60,
  status: 1
})

const rules = reactive({
  room_no: [
    { required: true, message: '必须填写教室编号', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_-]+$/, message: '编号只能包含字母数字横线', trigger: 'blur' }
  ],
  name: [{ required: true, message: '教室名称不能为空', trigger: 'blur' }],
  location: [{ required: true, message: '请填写精确的物理位置', trigger: 'blur' }],
  capacity: [{ required: true, message: '必须规定教室限额', trigger: 'blur' }]
})

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields()
  Object.assign(formData, { id: null, room_no: '', name: '', location: '', capacity: 60, status: 1 })
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
      url: `/admin/classroom/${row.id}`,
      method: 'delete'
    })
    ElNotification({
      title: '删除成功',
      message: `已移除教室：${row.name} (${row.room_no})`,
      type: 'success',
    })
    // 如果当前页只有一条数据，删除后回到上一页
    if (tableData.value.length === 1 && queryParams.page > 1) {
      queryParams.page -= 1
    }
    fetchData()
  } catch (error) {
    console.error('删除教室失败', error)
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
            url: '/admin/classroom', // 这里由于不需要 id，可以直接发送
            method: 'post',
            data: {
              room_no: formData.room_no,
              name: formData.name,
              location: formData.location,
              capacity: formData.capacity,
              status: formData.status
            }
          })
          ElMessage.success('教室设施添加成功！')
        } else {
          await request({
            url: '/admin/classroom',
            method: 'put',
            data: {
              id: formData.id,
              room_no: formData.room_no,
              name: formData.name,
              location: formData.location,
              capacity: formData.capacity,
              status: formData.status
            }
          })
          ElMessage.success('教室资料修改成功！')
        }
        
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('保存教室信息失败', error)
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
