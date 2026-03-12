<template>
  <div class="flex h-screen w-full bg-gray-100">
    <!-- 左侧菜单栏 -->
    <div 
      :class="['bg-gray-900 text-white flex flex-col transition-all duration-300 shadow-xl z-20', isCollapse ? 'w-[64px]' : 'w-64']"
    >
      <!-- Logo 区域 -->
      <div class="h-16 flex items-center justify-center bg-gray-950 shadow-md whitespace-nowrap overflow-hidden">
        <el-icon class="text-blue-500" :class="isCollapse ? '' : 'mr-2'" :size="24"><Monitor /></el-icon>
        <h1 v-show="!isCollapse" class="text-lg font-bold truncate transition-opacity duration-300">课堂学生行为分析</h1>
      </div>
      
      <!-- 菜单项 -->
      <el-menu
        :default-active="activeMenu"
        class="flex-1 w-full border-r-0 !bg-gray-900 custom-menu"
        background-color="#111827"
        text-color="#9ca3af"
        active-text-color="#3b82f6"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <!-- Has no visible children -> plain item -->
          <el-menu-item 
            v-if="!route.meta?.hidden && hasPermission(route) && (!route.children || !hasVisibleChildren(route.children))" 
            :index="resolvePath(route.path)"
          >
            <el-icon v-if="route.meta?.icon">
              <component :is="route.meta.icon" />
            </el-icon>
            <template #title>
              <span>{{ route.meta?.title || route.name }}</span>
            </template>
          </el-menu-item>
          
          <!-- Has visible children -> sub menu -->
          <el-sub-menu 
            v-else-if="!route.meta?.hidden && hasPermission(route) && route.children && hasVisibleChildren(route.children)" 
            :index="resolvePath(route.path)"
          >
            <template #title>
              <el-icon v-if="route.meta?.icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <span>{{ route.meta?.title || route.name }}</span>
            </template>
            <!-- Sub menu items -->
            <template v-for="child in route.children" :key="child.path">
              <el-menu-item 
                v-if="!child.meta?.hidden && hasPermission(child)" 
                :index="resolvePath(route.path + '/' + child.path)"
              >
                <el-icon v-if="child.meta?.icon" class="!mr-2 !text-base">
                  <component :is="child.meta.icon" />
                </el-icon>
                <span>{{ child.meta?.title || child.name }}</span>
              </el-menu-item>
            </template>
          </el-sub-menu>
        </template>
      </el-menu>
    </div>

    <!-- 右侧主体内容 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 顶部导航栏 -->
      <div class="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10 transition-all">
        <!-- 面包屑 / 页面标题 -->
        <div class="flex items-center text-gray-700 font-medium text-lg">
          <div 
            class="mr-4 cursor-pointer p-1.5 hover:bg-gray-100 rounded-lg flex items-center text-gray-500 hover:text-blue-600 transition-colors"
            @click="toggleCollapse"
          >
            <el-icon :size="20"><component :is="isCollapse ? 'Expand' : 'Fold'" /></el-icon>
          </div>
          <el-icon class="mr-2 text-gray-500"><Platform /></el-icon>
          {{ currentRouteTitle }}
        </div>
        
        <!-- 用户信息与操作 -->
        <div class="flex items-center space-x-4 cursor-pointer">
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="flex items-center hover:text-blue-600 transition-colors">
              <el-avatar :size="32" class="mr-2 bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md">
                {{ userStore.userInfo.username?.charAt(0).toUpperCase() || 'U' }}
              </el-avatar>
              <span class="text-sm font-medium">{{ userStore.userInfo.username || 'User' }}</span>
              <span 
                class="ml-2 px-2 py-0.5 text-xs rounded-full shadow-sm" 
                :class="userStore.userInfo.role === 1 ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'"
              >
                {{ userStore.userInfo.role === 1 ? '超级管理员' : '普通老师' }}
              </span>
              <el-icon class="ml-1"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- Main Content / Router View -->
      <div class="flex-1 overflow-auto p-6 bg-slate-50 relative">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { Monitor, Platform, ArrowDown, Expand, Fold } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 控制侧边栏折叠状态
const isCollapse = ref(false)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

// 过滤出 layout 下的子路由作为菜单
const menuRoutes = computed(() => {
  const layoutRoute = router.options.routes.find(r => r.path === '/')
  return layoutRoute ? layoutRoute.children : []
})

// 当前激活的菜单项
const activeMenu = computed(() => {
  return resolvePath(route.path)
})

// 当前路由的标题
const currentRouteTitle = computed(() => {
  return route.meta?.title || '工作台'
})

// 解析完整路径
const resolvePath = (p) => {
  if (p.startsWith('/')) return p
  return `/${p}` // 简化的处理，实际项目中可以根据具体子路由拼接
}

// 判断是否有权限渲染菜单
const hasPermission = (routeObj) => {
  if (!routeObj.meta || !routeObj.meta.roles) {
    return true // 没有配置角色的路由默认所有人可见
  }
  return routeObj.meta.roles.includes(userStore.userInfo.role)
}

// 检查是否包含可显示的子路由
const hasVisibleChildren = (children) => {
  if (!children) return false
  return children.some(child => !child.meta?.hidden && hasPermission(child))
}

// 处理下拉菜单点击
const handleCommand = async (command) => {
  if (command === 'logout') {
    await userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.custom-menu {
  border-right: none !important;
}

/* Element Plus Menu style overrides to match Tailwind UI */
:deep(.el-menu) {
  border-right: none;
}
:deep(.el-menu-item), :deep(.el-sub-menu__title) {
  margin: 4px 12px;
  border-radius: 8px;
  height: 48px;
  line-height: 48px;
}

:deep(.el-menu-item.is-active) {
  background-color: #1f2937 !important; /* Tailwind gray-800 */
  color: #60a5fa !important; /* Tailwind blue-400 */
}

:deep(.el-menu-item:hover), :deep(.el-sub-menu__title:hover) {
  background-color: #1f2937 !important; 
}

/* Secondary menu background logic */
:deep(.el-menu--inline) {
  background-color: #0f172a !important; /* Slate 900 for inner depth */
}
:deep(.el-menu--inline .el-menu-item) {
  margin-left: 20px;
  width: calc(100% - 32px);
}

/* Fix Element Plus collapsed menu centering */
:deep(.el-menu--collapse .el-menu-item),
:deep(.el-menu--collapse .el-sub-menu__title) {
  padding: 0 !important;
  justify-content: center;
}

:deep(.el-menu--collapse .el-menu-item .el-tooltip__trigger) {
  padding: 0 !important;
  justify-content: center;
  display: flex;
  align-items: center;
  width: 100%;
}

:deep(.el-menu--collapse .el-sub-menu__title .el-icon),
:deep(.el-menu--collapse .el-menu-item .el-icon) {
  margin: 0 !important;
}
</style>

<style>
/* Global styles for the collapsed sidebar popup menu */
/* Offset the popup further to the right to prevent overlapping with the narrow sidebar */
.el-popper.is-light {
  border: none !important;
  margin-left: 10px !important; /* Move popup away from sidebar */
}

/* Base style for the popup body */
.el-menu--popup {
  background-color: #1f2937 !important; /* Change to gray-800 to create slight contrast from the black gray-900 sidebar */
  border: 1px solid #374151 !important; /* Lighter border gray-700 */
  border-radius: 12px !important; /* More modern rounded corners */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3) !important;
  padding: 8px !important;
  min-width: 170px !important;
}

.el-menu--popup .el-menu-item {
  color: #d1d5db !important; /* gray-300 for better visibility */
  background-color: transparent !important;
  margin: 4px 6px !important;
  border-radius: 8px !important;
  height: 44px !important;
  line-height: 44px !important;
  font-size: 14px;
  transition: all 0.2s ease;
}

.el-menu--popup .el-menu-item:hover {
  background-color: #374151 !important; /* gray-700 hover */
  color: #fff !important;
  transform: translateX(4px);
}

.el-menu--popup .el-menu-item.is-active {
  background-color: #3b82f6 !important; /* blue-500 active */
  color: #ffffff !important;
  font-weight: 600;
}

/* Hide popper arrow for a cleaner modern look */
.el-menu--popup-container .el-popper__arrow {
  display: none !important;
}
</style>
