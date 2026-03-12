<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
    <!-- 顶栏操作区 -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <el-icon :size="20"><Operation /></el-icon>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">系统参数管理</h2>
          <p class="text-xs text-gray-500 mt-1">全局唯一激活项，统一调配各行为识别的扣分权重</p>
        </div>
      </div>
      
      <!-- 搜索与操作按钮同一行 -->
      <div class="flex items-center space-x-3 flex-nowrap shrink-0">
        <el-input 
          v-model="queryParams.keyword" 
          placeholder="搜索配置方案名称" 
          clearable
          class="w-56 !h-10"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-button type="primary" class="!h-10 px-4 font-medium ml-2 shadow-sm shadow-blue-500/30 transition-transform hover:-translate-y-0.5" @click="handleSearch">
          <el-icon class="mr-1"><Search /></el-icon>查询
        </el-button>
        <el-button type="success" class="!h-10 px-4 font-medium shadow-sm transition-transform hover:-translate-y-0.5" @click="handleAdd">
          <el-icon class="mr-1"><Plus /></el-icon>新增配置
        </el-button>
        <el-button type="warning" plain class="!h-10 px-4 font-medium transition-transform hover:-translate-y-0.5" @click="importDialogVisible = true">
          <el-icon class="mr-1"><Upload /></el-icon>导入方案 (JSON)
        </el-button>
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

        <el-table-column prop="config_name" label="配置方案名称" min-width="180" show-overflow-tooltip fixed>
          <template #default="{ row }">
            <span class="font-bold text-gray-800">{{ row.config_name }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="方案说明" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-gray-600">{{ row.description || '无补充说明' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="方案构成预览" width="300">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-1">
              <!-- 仅预览前三项内容，防过长 -->
              <el-tag 
                v-for="(item, idx) in parseConfig(row.config_content).slice(0, 3)" 
                :key="idx" 
                size="small" 
                :type="item.weight > 0 ? 'success' : 'danger'"
                effect="light"
                class="!border-none"
              >
                {{ item.name }}: {{ item.weight > 0 ? '+' + item.weight : item.weight }}
              </el-tag>
              <el-tag v-if="parseConfig(row.config_content).length > 3" size="small" type="info" effect="plain" class="!border-none">
                ...等{{ parseConfig(row.config_content).length }}项
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="当前状态" width="160" align="center">
          <template #default="{ row }">
            <div v-if="row.is_active === 1" class="flex items-center justify-center text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <span class="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              <span class="text-xs font-bold tracking-wider">全局使用中</span>
            </div>
            <el-button 
              v-else 
              type="primary" 
              plain 
              size="small" 
              class="!rounded-full font-medium" 
              @click="handleActivate(row)"
            >
              一键激活此方案
            </el-button>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="160" />

        <el-table-column label="操作" fixed="right" min-width="150" align="center">
          <template #default="scope">
            <el-button 
              link type="primary" size="small" 
              class="font-medium hover:text-blue-700 transition-colors" 
              @click="handleEdit(scope.row)"
            >
              <el-icon class="mr-1"><Edit /></el-icon>修改详情
            </el-button>
            <el-divider direction="vertical" />
            <el-popconfirm
              title="确定要永久删除此评分方案吗？"
              confirm-button-text="确认删除"
              cancel-button-text="暂不"
              confirm-button-type="danger"
              width="240"
              icon="Warning"
              icon-color="#ef4444"
              @confirm="handleDelete(scope.row)"
              :disabled="scope.row.is_active === 1"
            >
              <template #reference>
                <el-tooltip v-if="scope.row.is_active === 1" content="激活状态下的方案无法删除" placement="top">
                  <el-button link type="info" size="small" disabled class="font-medium">
                    <el-icon class="mr-1"><Delete /></el-icon>删除
                  </el-button>
                </el-tooltip>
                <el-button v-else link type="danger" size="small" class="font-medium hover:text-red-700 transition-colors">
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
      <div class="text-sm text-gray-500 font-medium ml-2">检索结果：<span class="text-blue-600 font-bold mx-1">{{ total }}</span>条方案</div>
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
      :title="dialogType === 'add' ? '新增配置方案' : '修改配置方案'"
      width="600px"
      destroy-on-close
      class="custom-dialog"
    >
      <div class="px-2 pt-4">
        <el-form 
          ref="formRef" 
          :model="formData" 
          :rules="rules" 
          label-position="top" 
          class="custom-form"
          status-icon
        >
          <el-form-item label="配置方案名称" prop="config_name">
            <el-input v-model="formData.config_name" placeholder="为该参数集合命名（如：默认方案、期末严考）" maxlength="50" />
          </el-form-item>
          
          <el-form-item label="配置方案描述" prop="description">
            <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="补充说明适用场景" maxlength="200" />
          </el-form-item>
          
          <el-form-item label="行为权重定义 (JSON Array格式)" prop="config_content">
            <el-input 
              v-model="formData.config_content" 
              type="textarea" 
              :rows="8" 
              placeholder='[{"behaviorType":"listening", "name":"听讲", "weight": 5}]'
              class="font-mono text-sm shadow-inner"
            />
            <div class="text-xs text-gray-400 mt-2">支持的 behaviorType 参照文档说明，建议通过外部 JSON 工具校验格式。</div>
          </el-form-item>
          
          <el-form-item v-if="dialogType === 'add'">
            <div class="flex items-center space-x-2 bg-indigo-50 px-3 py-2 rounded">
              <el-switch v-model="formData.is_active" :active-value="1" :inactive-value="0" />
              <span class="text-sm font-medium text-indigo-700">创建后立即全局激活此方案（将会顶替掉现有已激活方案）</span>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer flex justify-end space-x-3 pt-2">
          <el-button @click="dialogVisible = false" class="!px-6">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading" class="!px-6 shadow-md shadow-blue-500/30">
            {{ dialogType === 'add' ? '确认保存' : '保存修改' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- JSON 批量导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="拖拽导入行为配置方案"
      width="500px"
      class="custom-dialog"
    >
      <div class="px-2 pt-2">
        <el-upload
          class="drag-uploader w-full"
          drag
          action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
          :auto-upload="true"
          :on-success="handleImportSuccess"
          :before-upload="beforeImportUpload"
          accept=".json"
        >
          <div class="h-full flex flex-col justify-center text-center p-6 bg-orange-50/50">
            <el-icon class="el-icon--upload text-orange-400"><Document /></el-icon>
            <div class="el-upload__text mt-2 font-medium">
              点击或拖拽上传 <em>JSON 配置文件</em>
            </div>
            <div class="el-upload__tip text-gray-400 mt-2">
              内部遵守 <code>[{behaviorType, name, weight}]</code> 结构。<br>导入后作为最新方案录入参数表中。
            </div>
          </div>
        </el-upload>
      </div>
      <template #footer>
        <div class="text-left text-xs pt-2">
          <span class="text-gray-400">导入成功后，需要在列表页手动点击激活才能全局生效。</span>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete, Operation, Warning, Upload, Document } from '@element-plus/icons-vue'
import request from '@/utils/request'

// --- 状态及分页检索 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const queryParams = reactive({
  keyword: '',
  page: 1,
  size: 10
})

// === Mock 工具库 ===
const parseConfig = (jsonStr) => {
  try {
    const data = JSON.parse(jsonStr)
    return Array.isArray(data) ? data : []
  } catch (e) {
    return []
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/admin/config/page',
      method: 'get',
      params: {
        page: queryParams.page,
        size: queryParams.size,
        keyword: queryParams.keyword || undefined
      }
    })
    
    // 把激活项提到最前 (或者让后端排序更佳)
    let records = res.records || []
    records.sort((a, b) => b.is_active - a.is_active)
    
    tableData.value = records
    total.value = res.total || 0
  } catch (error) {
    console.error('获取系统参数配置列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  fetchData()
}

// 一键排他激活逻辑 (关键业务)
const handleActivate = (row) => {
  ElMessageBox.confirm(
    `当前全局计分即将被切换为 <strong>[${row.config_name}]</strong>，之前的激活方案将被顶替。\n\n是否确认切换？`,
    '激活排他性重置确认',
    {
      confirmButtonText: '立即接管全局',
      cancelButtonText: '暂不更改',
      type: 'warning',
      dangerouslyUseHTMLString: true,
      confirmButtonClass: 'el-button--primary'
    }
  ).then(async () => {
    loading.value = true
    try {
      await request({
        url: `/admin/config/${row.id}/active`,
        method: 'put'
      })
      ElMessage.success(`配置切换成功！当前已挂载 [${row.config_name}] 作为识别权重框架。`)
      fetchData()
    } catch (error) {
      console.error('激活方案失败', error)
      loading.value = false
    }
  }).catch(() => {})
}

// --- 对话框表单管理 ---
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const dialogType = ref('add')
const submitLoading = ref(false)
const formRef = ref(null)

const formData = reactive({
  id: null,
  config_name: '',
  description: '',
  is_active: 0,
  config_content: ''
})

const validateJSON = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入具体的权重JSON映射！'))
    return
  }
  try {
    const arr = JSON.parse(value)
    if (!Array.isArray(arr)) {
      callback(new Error('最外层必须为 JSON Array 数组格式 []'))
      return
    }
    // Simple basic validation
    if (arr.length > 0 && !arr[0].behaviorType) {
      callback(new Error('至少要包含有效的 behaviorType 键名'))
      return
    }
    callback()
  } catch(e) {
    callback(new Error('格式不符合严格 JSON 标准（须双引号包裹键名等），请检查！'))
  }
}

const rules = reactive({
  config_name: [{ required: true, message: '请填写配置方案缩略名', trigger: 'blur' }],
  config_content: [{ validator: validateJSON, trigger: 'blur' }]
})

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields()
  Object.assign(formData, { id: null, config_name: '', description: '', is_active: 0, config_content: '' })
}

const handleAdd = () => {
  dialogType.value = 'add'
  resetForm()
  formData.config_content = "[\n  {\"behaviorType\": \"listening\", \"name\": \"听讲\", \"weight\": 5.0}\n]"
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  resetForm()
  Object.assign(formData, { ...row })
  // 整理格式化 JSON string 回填
  try {
    formData.config_content = JSON.stringify(JSON.parse(row.config_content), null, 2)
  } catch(e) {}
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  loading.value = true
  try {
    await request({
      url: `/admin/config/${row.id}`,
      method: 'delete'
    })
    ElNotification({ title: '删除成功', message: `旧版本配置 [${row.config_name}] 已从系统中清理。`, type: 'success' })
    if (tableData.value.length === 1 && queryParams.page > 1) {
      queryParams.page -= 1
    }
    fetchData()
  } catch (error) {
    console.error('删除配置项失败', error)
    loading.value = false
  }
}

const handleSubmit = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      
      const payload = { ...formData }
      // 压缩 JSON
      payload.config_content = JSON.stringify(JSON.parse(formData.config_content))
      
      try {
        if (dialogType.value === 'add') {
          // 在新增时传递 is_active 将后端一同激活
          await request({
            url: '/admin/config',
            method: 'post',
            data: {
              config_name: payload.config_name,
              description: payload.description,
              config_content: payload.config_content,
              is_active: payload.is_active
            }
          })
          ElMessage.success('配置方案建立成果，参数保存落库。')
        } else {
          // 修改操作
          await request({
            url: '/admin/config',
            method: 'put',
            data: {
              id: payload.id,
              config_name: payload.config_name,
              description: payload.description,
              config_content: payload.config_content
            }
          })
          ElMessage.success('成功修改现有的参数映射版本！')
        }
        
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('保存配置失败', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 批量 JSON 导入
const beforeImportUpload = (file) => {
  const isJson = file.type === 'application/json' || file.name.endsWith('.json')
  if (!isJson) ElMessage.error('仅能解析标准的 .json 扩展名文件')
  return isJson
}
const handleImportSuccess = (res, file) => {
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result)
      const importedStr = JSON.stringify(Array.isArray(data) ? data : (data.config_content || []))
      
      const payload = {
        config_name: `[导入] 最新外部导入方案`,
        description: '由用户终端文件拖拽产生',
        config_content: importedStr,
        is_active: 0
      }
      
      await request({
        url: '/admin/config',
        method: 'post',
        data: payload
      })
      
      ElNotification({ title: 'JSON 映射载入完毕', message: '数据库已添加这套新配置，你可以点击修改验证其准确性。', type: 'success' })
      importDialogVisible.value = false
      fetchData()
    } catch(err) {
      console.error('导入失败', err)
      ElMessage.error('解析上传文档失败或接口异常，请检查文件编码和键值格式')
    }
  }
  reader.readAsText(file.raw)
}

onMounted(() => {
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
  border-color: #f97316;
  background-color: #fff7ed;
}
:deep(.drag-uploader .el-icon--upload) {
  font-size: 36px;
  margin-bottom: 8px;
  line-height: 1;
}
</style>
