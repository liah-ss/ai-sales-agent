<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../api/client'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: '',
})
const isSubmitting = shallowRef(false)
const error = shallowRef('')
const redirectTarget = computed(() => String(route.query.redirect || '/'))

async function submitLogin() {
  error.value = ''
  if (!form.username.trim() || !form.password) {
    error.value = '请输入用户名和密码。'
    return
  }

  isSubmitting.value = true
  try {
    await authStore.login(form.username.trim(), form.password)
    await router.replace(redirectTarget.value)
  } catch (loginError) {
    if (loginError instanceof ApiError && loginError.status === 401) {
      error.value = '用户名或密码错误。'
    } else if (loginError instanceof TypeError) {
      error.value = '无法连接后台服务，请确认 API 服务已启动。'
    } else {
      error.value = '登录服务异常，请稍后重试。'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-card">
      <div>
        <span class="system-label">企业内部管理</span>
        <h1>登录 ExampleCorp 后台</h1>
        <p>管理网站内容、产品资料、客户询盘和企业文件。</p>
      </div>

      <form class="login-form" autocomplete="off" @submit.prevent="submitLogin">
        <label>
          用户名
          <input v-model="form.username" autocomplete="off" name="management-username" />
        </label>
        <label>
          密码
          <input v-model="form.password" autocomplete="new-password" name="management-password" type="password" />
        </label>
        <p v-if="error" class="form-alert error">{{ error }}</p>
        <button class="primary-button" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? '登录中...' : '登录' }}
        </button>
      </form>
    </section>
  </main>
</template>
