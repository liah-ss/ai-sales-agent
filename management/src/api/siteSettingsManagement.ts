import { apiGet, apiPut } from './client'
import type { SiteSettings } from '../types/siteSettings'

export function getManagementSiteSettings(token: string) {
  return apiGet<SiteSettings>('/management/site-settings', token)
}

export function saveManagementSiteSettings(payload: SiteSettings, token: string) {
  return apiPut<SiteSettings, SiteSettings>('/management/site-settings', payload, token)
}
