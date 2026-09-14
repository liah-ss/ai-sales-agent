import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { ApiError } from '../api/client'
import { getCurrentUser, login as loginRequest, type AdminUser } from '../api/auth'

const TOKEN_STORAGE_KEY = 'examplecorp_management_token'

export const useAuthStore = defineStore('auth', () => {
  const token = shallowRef('')
  const user = shallowRef<AdminUser | null>(null)
  const isBootstrapped = shallowRef(false)
  const isAuthenticated = computed(() => Boolean(token.value && user.value))

  async function login(username: string, password: string) {
    const response = await loginRequest({ username, password })
    token.value = response.access_token
    user.value = response.user
    localStorage.setItem(TOKEN_STORAGE_KEY, response.access_token)
  }

  async function bootstrap() {
    if (isBootstrapped.value) return
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!storedToken) {
      isBootstrapped.value = true
      return
    }

    try {
      user.value = await getCurrentUser(storedToken)
      token.value = storedToken
    } catch (error) {
      if (error instanceof ApiError && [401, 403].includes(error.status)) {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
      }
      token.value = ''
      user.value = null
    } finally {
      isBootstrapped.value = true
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    token.value = ''
    user.value = null
  }

  return {
    token,
    user,
    isBootstrapped,
    isAuthenticated,
    login,
    bootstrap,
    logout,
  }
})
