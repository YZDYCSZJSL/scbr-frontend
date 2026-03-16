import request from '@/utils/request'

// 分页查询任务中心列表
export function getTaskCenterPage(params) {
    return request({
        url: '/task-center/page',
        method: 'get',
        params
    })
}

// 查询任务详情
export function getTaskCenterDetail(taskId) {
    return request({
        url: `/task-center/${taskId}`,
        method: 'get'
    })
}

// 查询任务日志
export function getTaskCenterLogs(taskId) {
    return request({
        url: `/task-center/${taskId}/logs`,
        method: 'get'
    })
}

// 重试失败任务
export function retryTask(taskId) {
    return request({
        url: `/task-center/${taskId}/retry`,
        method: 'post'
    })
}