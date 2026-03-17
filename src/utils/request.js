import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import router from '@/router'

// 创建 axios 实例
const service = axios.create({
    baseURL: '/api/v1', // 使用相对路径触发 Vite 代理以解决跨域问题
    timeout: 10000 // 请求超时时间 (10秒)
})

// request 拦截器
service.interceptors.request.use(
    config => {
        // 获取 Pinia user store
        const userStore = useUserStore()

        // 如果 token 存在，将 token 携带在请求 Header 中
        if (userStore.token) {
            config.headers['Authorization'] = `Bearer ${userStore.token}`
        }
        return config
    },
    error => {
        console.error('Request Error:', error)
        return Promise.reject(error)
    }
)

// response 拦截器
service.interceptors.response.use(
    response => {
        // [修复] 放行二进制流（如 Excel 导出），绕过常规的 JSON 状态码校验
        if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
            return response.data
        }

        const res = response.data

        // code = 200: 正常返回 data 内容
        if (res.code === 200) {
            return res.data
        }

        // code = 401: Token 失效，自动跳转至登录页
        if (res.code === 401) {
            const currentPath = router.currentRoute.value.path
            // 如果已经在登录页（如：登录失败），就不做重复弹窗和跳转
            if (currentPath !== '/login') {
                ElMessage({
                    message: res.message || '登录状态已过期，请重新登录',
                    type: 'warning',
                    duration: 3 * 1000
                })
                const userStore = useUserStore()
                // 清除用户信息并重定向到登录页（带上回跳地址）
                userStore.logout().then(() => {
                    router.push(`/login?redirect=${currentPath}`)
                })
            }
            return Promise.reject(new Error(res.message || 'Token 失效'))
        }

        // code = 403: 无权限访问
        if (res.code === 403) {
            ElMessage({
                message: res.message || '无权限访问',
                type: 'warning',
                duration: 3 * 1000
            })
            return Promise.reject(new Error(res.message || 'Forbidden'))
        }

        // code = 500 或其它非 200 错误：弹出后端返回的 message 错误提示
        ElMessage({
            message: res.message || '操作失败',
            type: 'error',
            duration: 5 * 1000
        })
        return Promise.reject(new Error(res.message || 'Error'))
    },
    error => {
        console.error('Response Error:', error)
        // 处理 HTTP 层面的错误（如 404, 502 等）
        ElMessage({
            message: error.response?.data?.message || error.message || '请求失败，请检查网络或后端服务',
            type: 'error',
            duration: 5 * 1000
        })
        return Promise.reject(error)
    }
)

export default service
