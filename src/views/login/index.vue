<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80');">
    <div class="absolute inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm"></div>
    <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
      <div class="flex justify-center text-blue-500 mb-4 bg-white/10 w-24 h-24 rounded-2xl mx-auto shadow-2xl items-center border border-white/20">
        <el-icon :size="48" class="text-white drop-shadow-lg"><Monitor /></el-icon>
      </div>
      <h2 class="mt-4 text-center text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
        课堂学生行为分析系统
      </h2>
      <p class="mt-2 text-center text-sm text-blue-200">
        AI-Powered Classroom Behavior Analytics Platform
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
      <div class="bg-white/95 backdrop-blur-md py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/40">
        <el-form 
          ref="loginFormRef" 
          :model="loginForm" 
          :rules="rules"
          class="space-y-6"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input 
              v-model="loginForm.username" 
              placeholder="请输入账号 (admin/teacher)"
              size="large"
              class="!text-lg"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="请输入密码 (123456)"
              show-password
              size="large"
              class="!text-lg"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <div class="flex items-center justify-between mt-4 mb-2">
            <div class="flex items-center">
              <el-checkbox v-model="rememberMe" class="!text-gray-600">记住登录状态</el-checkbox>
            </div>
            <div class="text-sm">
              <a href="#" class="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                忘记密码?
              </a>
            </div>
          </div>

          <el-button 
            type="primary" 
            :loading="loading" 
            class="w-full !text-base !h-12 !rounded-xl !font-bold shadow-lg shadow-blue-500/30 transition-transform hover:-translate-y-0.5" 
            @click="handleLogin"
          >
            登录系统
          </el-button>
          
          <div class="mt-6 text-xs text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p class="font-bold text-gray-700 mb-1">测试账号说明：</p>
            <p>👨‍💼 管理员：admin / 123456</p>
            <p>👩‍🏫 教 师：teacher / 123456</p>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { User, Lock, Monitor } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)
const rememberMe = ref(false)

const loginForm = reactive({
  username: 'admin',
  password: '123456'
})

const rules = reactive({
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
})

const handleLogin = () => {
  loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(loginForm)
        ElMessage.success('登录成功，欢迎回来！')
        const redirect = route.query.redirect || '/'
        router.push(redirect)
      } catch (error) {
        ElMessage.error(error.message || '登录失败，请检查账号密码')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>
