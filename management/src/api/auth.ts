import { apiGet, apiPost } from './client'

export interface AdminUser {
  id: number
  username: string
  role: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: 'bearer'
  user: AdminUser
}

export function login(payload: LoginPayload) {
  return apiPost<LoginResponse, LoginPayload>('/management/auth/login', payload)
}

export function getCurrentUser(token: string) {
  return apiGet<AdminUser>('/management/auth/me', token)
}
