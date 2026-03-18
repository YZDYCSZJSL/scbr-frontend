import { ref, onMounted, type Ref } from 'vue'
import { fetchScheduleListApi } from '../api'
import type { ScheduleAnalysisVO, ScheduleAnalysisInitVO } from '../api'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'

export function useSchedule(mediaType: Ref<'camera' | 'local'>, selectedClass: Ref<number | null>) {
  const route = useRoute()
  const prefillApplied = ref(false)
  const scheduleAnalysisInit = ref<ScheduleAnalysisInitVO | null>(null)
  const scheduleOptions = ref<ScheduleAnalysisVO[]>([])

  const readScheduleAnalysisInit = (): ScheduleAnalysisInitVO | null => {
    try {
      const raw = sessionStorage.getItem('scheduleAnalysisInit')
      if (!raw) return null
      return JSON.parse(raw)
    } catch (error) {
      console.error('解析 scheduleAnalysisInit 失败', error)
      return null
    }
  }

  const applySchedulePrefill = () => {
    if (prefillApplied.value) return
    if (route.query.prefill !== '1') return

    const init = readScheduleAnalysisInit()
    if (!init || !init.scheduleId) return

    scheduleAnalysisInit.value = init

    const matched = scheduleOptions.value.find(
      item => Number(item.id || item.scheduleId) === Number(init.scheduleId)
    )

    if (matched) {
      selectedClass.value = Number(matched.id || matched.scheduleId)
      prefillApplied.value = true
      ElMessage.success('已自动带入排课信息，请继续上传文件或启动实时分析')
    }
  }

  const fetchScheduleList = async () => {
    try {
      const streamType = mediaType.value === 'camera' ? 1 : 2
      const response: any = await fetchScheduleListApi(streamType)
      
      const dataList = response?.records || response?.data || response
      scheduleOptions.value = Array.isArray(dataList) ? dataList : []
      applySchedulePrefill()
    } catch (error) {
      console.error('获取排课列表失败', error)
      scheduleOptions.value = []
    }
  }

  onMounted(() => {
    fetchScheduleList()
  })

  return {
    scheduleOptions,
    scheduleAnalysisInit,
    fetchScheduleList,
    applySchedulePrefill
  }
}
