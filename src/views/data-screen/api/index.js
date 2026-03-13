import request from '@/utils/request'

export function getDashboardOverview(params) {
    return request({
        url: '/dashboard/overview',
        method: 'get',
        params
    })
}