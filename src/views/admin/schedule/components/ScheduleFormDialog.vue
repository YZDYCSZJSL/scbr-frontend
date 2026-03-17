<template>
  <el-dialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增排课计划' : '修改排课规则'"
    width="580px"
    destroy-on-close
    class="custom-dialog"
    @close="handleClose"
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
                v-model="internalSemesterId"
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
        <el-button @click="visible = false" class="!px-6">取消</el-button>
        <el-button type="primary" @click="onSubmit" :loading="submitLoading" class="!px-6 shadow-md shadow-blue-500/30">
          {{ dialogType === 'add' ? '生成排课' : '保存修改' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, reactive } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  dialogType: String,
  formData: Object,
  conflictMsg: String,
  submitLoading: Boolean,
  teacherList: Array,
  courseList: Array,
  roomList: Array,
  sectionList: Array,
  semesterOptions: Array,
  selectedFormSemesterConfigId: [String, Number]
})

const emit = defineEmits(['update:modelValue', 'update:selectedFormSemesterConfigId', 'submit', 'semesterChange', 'semesterClear', 'closed'])

const visible = ref(props.modelValue)
const formRef = ref(null)
const internalSemesterId = ref(props.selectedFormSemesterConfigId)

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.selectedFormSemesterConfigId, (val) => {
  internalSemesterId.value = val
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

const handleFormSemesterChange = (val) => {
  emit('update:selectedFormSemesterConfigId', val)
  emit('semesterChange', val)
}

const handleFormSemesterClear = () => {
  emit('update:selectedFormSemesterConfigId', '')
  emit('semesterClear')
}

const handleClose = () => {
  emit('closed')
}

const onSubmit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      emit('submit')
    }
  })
}

defineExpose({ formRef })
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
</style>
