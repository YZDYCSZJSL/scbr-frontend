<template>
  <div v-loading="loading" class="h-full overflow-auto bg-slate-50 p-4">
    <div v-if="!queryParams.academicYear || !queryParams.semester" class="h-full flex items-center justify-center text-gray-400 text-sm">
      请先选择学年学期，再切换到周视图
    </div>

    <div v-else class="min-w-[980px]">
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
            @click="$emit('openAction', item)"
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
</template>

<script setup>
const props = defineProps({
  loading: Boolean,
  queryParams: Object,
  sectionList: Array,
  weekViewData: Array
})

defineEmits(['openAction'])

const weekDays = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 }
]

const formatWeekType = (weekType) => {
  const map = { 0: '全周', 1: '单周', 2: '双周' }
  return map[weekType] || '-'
}

const getWeekCellCoursesByStart = (weekday, sectionNo) => {
  return props.weekViewData.filter(item => {
    return Number(item.weekday) === Number(weekday)
      && Number(item.startSectionNo) === Number(sectionNo)
  })
}
</script>
