<template>
  <el-dialog
    v-model="visible"
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
        <el-button type="success" @click="$emit('goAnalysis')">
          <el-icon class="mr-1"><DataAnalysis /></el-icon>去分析
        </el-button>

        <el-button type="primary" @click="$emit('edit')">
          <el-icon class="mr-1"><Edit /></el-icon>修改
        </el-button>

        <el-button type="danger" @click="$emit('delete')">
          <el-icon class="mr-1"><Delete /></el-icon>删除
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { DataAnalysis, Edit, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean,
  currentWeekCourse: Object
})

const emit = defineEmits(['update:modelValue', 'goAnalysis', 'edit', 'delete'])

const visible = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const formatWeekday = (weekday) => {
  const map = { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日' }
  return map[weekday] || '-'
}

const formatWeekType = (weekType) => {
  const map = { 0: '全周', 1: '单周', 2: '双周' }
  return map[weekType] || '-'
}
</script>
