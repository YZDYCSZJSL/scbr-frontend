import request from '@/utils/request'

// 登录日志分页
export function getLoginLogPage(params) {
    return request({
        url: '/log/login/page',
        method: 'get',
        params
    })
}

// 操作日志分页
export function getOperationLogPage(params) {
    return request({
        url: '/log/operation/page',
        method: 'get',
        params
    })
}

// 任务日志分页
export function getTaskLogPage(params) {
    return request({
        url: '/log/task/page',
        method: 'get',
        params
    })
}