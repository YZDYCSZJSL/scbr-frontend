import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/login/index.vue'),
        meta: {
            hidden: true // 隐藏该路由不在侧边栏显示
        }
    },
    {
        path: '/',
        component: () => import('@/layout/index.vue'),
        redirect: '/dashboard',
        children: [
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('@/views/dashboard/index.vue'),
                meta: { title: '我的工作台', icon: 'Platform' }
            },
            {
                path: 'data-screen',
                name: 'DataScreen',
                component: () => import('@/views/data-screen/index.vue'),
                meta: { title: '数据看板', icon: 'DataAnalysis' } // 加载到侧边栏显示，图标可自选
            },
            {
                path: 'task-center',
                name: 'TaskCenter',
                component: () => import('@/views/task-center/index.vue'),
                meta: { title: '分析任务中心', icon: 'List' }
            },
            {
                path: 'history',
                name: 'History',
                component: () => import('@/views/history/index.vue'),
                meta: { title: '课堂分析报告', icon: 'DataLine' }
            },
            {
                path: 'history/:taskId',
                name: 'HistoryDetail',
                component: () => import('@/views/history/detail.vue'),
                meta: { hidden: true }
            },
            // 基础数据/管理员专属菜单
            {
                path: 'data',
                name: 'DataManage',
                meta: { title: '基础数据管理', icon: 'Document', roles: [1] }, // 仅超级管理员可见
                children: [
                    {
                        path: 'teacher',
                        name: 'TeacherManage',
                        component: () => import('@/views/admin/teacher/index.vue'),
                        meta: { title: '教师管理', icon: 'User' }
                    },
                    {
                        path: 'course',
                        name: 'CourseManage',
                        component: () => import('@/views/admin/course/index.vue'),
                        meta: { title: '课程管理', icon: 'Reading' }
                    },
                    {
                        path: 'classroom',
                        name: 'ClassroomManage',
                        component: () => import('@/views/admin/classroom/index.vue'),
                        meta: { title: '教室管理', icon: 'Location' }
                    },
                    {
                        path: 'schedule',
                        name: 'ScheduleManage',
                        component: () => import('@/views/admin/schedule/index.vue'),
                        meta: { title: '排课管理', icon: 'Calendar' }
                    }
                ]
            },
            {
                path: 'config',
                name: 'SystemConfig',
                component: () => import('@/views/admin/config/index.vue'),
                meta: { title: '系统参数', icon: 'Operation', roles: [1] } // 仅超级管理员可见
            },
            {
                path: 'log',
                name: 'LogCenter',
                component: () => import('@/views/admin/log/index.vue'),
                meta: { title: '日志中心', icon: 'Tickets', roles: [1] }
            }
        ]
    },

    {
        // 捕获所有未定义路由
        path: '/:pathMatch(.*)*',
        redirect: '/',
        meta: { hidden: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
    const userStore = useUserStore()

    if (userStore.token) {
        // 已经登录，如果去登录页则重定向到首页
        if (to.path === '/login') {
            next({ path: '/' })
        } else {
            // 兜底判断：如果有 token，但是 userInfo 丢失或者格式异常导致拿不到 role
            if (!userStore.userInfo || typeof userStore.userInfo.role === 'undefined') {
                console.warn('UserInfo is missing or corrupted, requiring re-login')
                userStore.logout().then(() => {
                    next(`/login?redirect=${to.path}`)
                })
                return
            }

            // 判断权限
            const requiredRoles = to.meta.roles
            if (requiredRoles && !requiredRoles.includes(userStore.userInfo.role)) {
                // 如果没有权限
                next({ path: '/' })
            } else {
                next()
            }
        }
    } else {
        // 未登录
        if (to.path === '/login') {
            next() // 可以直接访问登录页
        } else {
            next(`/login?redirect=${to.path}`) // 否则全部重定向到登录页
        }
    }
})

export default router
