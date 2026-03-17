import request from '@/utils/request' // 假设项目有统一的 axios 原创 request 封装

/**
 * 报表条件分页查询接口
 * @param {Object} params - 包含 { keyword, startDate, endDate, page, size }
 */
export function getReportPage(params) {
  return request({
    url: '/report/page',
    method: 'get',
    params
  })
}

/**
 * 单条/批量统一导出接口
 * @param {Array} ids - 选中的记录 ID 数组，单条导出传 [id]
 */
export function exportReportToExcel(ids) {
  return request({
    url: '/report/export',
    method: 'post',
    data: { ids },
    responseType: 'blob' // 1. 接流的“碗”：告诉 axios 这是二进制文件流
  }).then((res) => {
    // 3. 完善下载逻辑：防坑设计（如果后端实际业务报错，Spring 会用 JSON 替代流，这时候拿到的是 type 为 json 的 Blob）
    if (res.type === 'application/json') {
      const reader = new FileReader()
      reader.onload = function () {
        const errorData = JSON.parse(reader.result)
        console.error('导出异常:', errorData.message)
      }
      reader.readAsText(res)
      return Promise.reject(new Error('导出失败，服务器返回了异常业务信息'))
    }

    // 真正处理后端返回的 Excel 二进制文件流
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.style.display = 'none'
    link.href = downloadUrl

    // 生成带时间戳的文件名防止重复覆盖
    const fileName = `课堂分析报表_${new Date().getTime()}.xlsx`
    link.setAttribute('download', fileName)

    document.body.appendChild(link)
    link.click()

    // 完成后立马卸磨杀驴，不留垃圾防内存泄漏
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  })
}

/**
 * 报表详情（主子表）接口
 * @param {string|number} id - 主键
 */
export function getReportDetail(id) {
  return request({
    url: `/report/${id}/detail`,
    method: 'get'
  })
}

/**
 * 课堂评估报告详情接口
 * @param {string|number} taskId - 任务ID
 */
export function getReportEvaluation(taskId) {
  return request({
    url: `/report/${taskId}/evaluation`,
    method: 'get'
  })
}

/**
 * 课堂评估趋势数据接口
 * @param {string|number} taskId - 任务ID
 */
export function getReportTrend(taskId) {
  return request({
    url: `/report/${taskId}/trend`,
    method: 'get'
  })
}

/**
 * 课堂异常抓拍数据接口
 * @param {string|number} taskId - 任务ID
 */
export function getReportAbnormalSnapshots(taskId) {
  return request({
    url: `/report/${taskId}/abnormal-snapshots`,
    method: 'get'
  })
}

/**
 * 手动生成课堂评估报告
 * @param {string|number} taskId - 任务ID
 */
export function generateReport(taskId) {
  return request({
    url: `/report/${taskId}/generate`,
    method: 'post'
  })
}