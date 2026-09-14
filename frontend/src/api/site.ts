import { apiGet } from './client'
import { cachedRequest } from './requestCache'
import type { SiteSettings } from '../types/site'

export interface HealthResponse {
  status: string
}

export function getHealth() {
  return apiGet<HealthResponse>('/health')
}

export function getSiteSettings() {
  return cachedRequest('site:/site-settings', () => apiGet<SiteSettings>('/site-settings'))
}
