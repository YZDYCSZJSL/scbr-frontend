<template>
  <div class="task-log-timeline">
    <el-empty v-if="!logs || logs.length === 0" description="暂无任务日志" />

    <el-timeline v-else>
      <el-timeline-item
        v-for="item in logs"
        :key="item.id || `${item.stage}-${item.createdAt}`"
        :timestamp="item.createdAt || '-'"
        :type="getTimelineType(item)"
      >
        <div class="log-item">
          <div class="log-header">
            <el-tag size="small" :type="getStageTagType(item.stage)">
              {{ formatStage(item.stage) }}
            </el-tag>
            <el-tag size="small" :type="item.status === 1 ? 'success' : 'danger'">
              {{ item.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </div>

          <div class="log-message">
            {{ item.message || '-' }}
          </div>

          <div v-if="item.detailJson" class="log-detail">
            <pre>{{ formatDetail(item.detailJson) }}</pre>
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup>
const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  }
})

function formatStage(stage) {
  const map = {
    CREATED: '任务创建',
    UPLOADED: '文件上传',
    RUNNING: '开始分析',
    MODEL_ACCEPTED: '模型已接收',
    WAITING_CALLBACK: '等待回调',
    CALLBACK_SUCCESS: '回调成功',
    CALLBACK_FAIL: '回调失败',
    FINISHED: '任务完成',
    RUN_FAIL: '执行失败',
    STOPPED: '任务停止',
    RETRY: '任务重试'
  }
  return map[stage] || stage || '-'
}

function getStageTagType(stage) {
  const map = {
    CREATED: '',
    UPLOADED: 'info',
    RUNNING: 'warning',
    MODEL_ACCEPTED: 'warning',
    WAITING_CALLBACK: 'warning',
    CALLBACK_SUCCESS: 'success',
    CALLBACK_FAIL: 'danger',
    FINISHED: 'success',
    RUN_FAIL: 'danger',
    STOPPED: 'info',
    RETRY: 'primary'
  }
  return map[stage] || ''
}

function getTimelineType(item) {
  if (item.status === 0) return 'danger'
  if (['RUNNING', 'MODEL_ACCEPTED', 'WAITING_CALLBACK'].includes(item.stage)) return 'warning'
  return 'primary'
}

function formatDetail(detailJson) {
  if (!detailJson) return ''
  if (typeof detailJson === 'string') {
    try {
      return JSON.stringify(JSON.parse(detailJson), null, 2)
    } catch (e) {
      return detailJson
    }
  }
  return JSON.stringify(detailJson, null, 2)
}
</script>

<style scoped>
.task-log-timeline {
  padding: 4px 0;
}

.log-item {
  padding: 6px 0;
}

.log-header {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.log-message {
  color: #303133;
  line-height: 1.6;
  margin-bottom: 8px;
}

.log-detail {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 10px 12px;
  overflow-x: auto;
}

.log-detail pre {
  margin: 0;
  font-size: 12px;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>