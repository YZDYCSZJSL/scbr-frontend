import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useUserStore = defineStore('user', {
    state: () => {
        let initUserInfo = {}
        try {
            const storedInfo = localStorage.getItem('userInfo')
            initUserInfo = storedInfo ? JSON.parse(storedInfo) : {}
            // 兜底处理：如果解析出来不是对象，或者为空，则给空对象
            if (typeof initUserInfo !== 'object' || initUserInfo === null) {
                initUserInfo = {}
            }
        } catch (e) {
            initUserInfo = {}
        }
        return {
            token: localStorage.getItem('token') || '',
            userInfo: initUserInfo
        }
    },
    actions: {
        // 真实 API 登录
        async login(loginForm) {
            try {
                // 调用登录接口，request 拦截器已经处理了 baseURL 并将有效层数据解构为 res.data
                const data = await request({
                    url: '/auth/login',
                    method: 'post',
                    data: loginForm
                })

                // 将 token 和用户信息存入 state 和 localStorage
                this.token = data.token
                this.userInfo = data.userInfo

                localStorage.setItem('token', this.token)
                localStorage.setItem('userInfo', JSON.stringify(this.userInfo))

                return data
            } catch (error) {
                // 抛出错误交由组件层处理
                throw error
            }
        },
        // 退出登录
        logout() {
            return new Promise((resolve) => {
                this.token = ''
                this.userInfo = {}
                localStorage.removeItem('token')
                localStorage.removeItem('userInfo')
                resolve()
            })
        }
    }
})
