import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import './style.css' // 引入 tailwind css，且在 Element Plus 之后挂载，方便覆盖样式
import './styles/element-theme.css' // 全局 Element Plus 主题统一覆盖
import './styles/common.css' // 全局通用页面容器样式

const app = createApp(App)
const pinia = createPinia()

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)

app.mount('#app')
