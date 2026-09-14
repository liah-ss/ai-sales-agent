import { apiDownload, apiGet, apiPatch, apiPut, apiUploadForm } from './client'
import type { ManagedFile, ManagedFileFilters, ManagedFileUpdate, ManagedFileUploadPayload } from '../types/file'

export function getManagementFiles(token: string, filters: ManagedFileFilters = {}) {
  const search = new URLSearchParams()
  if (filters.usage && filters.usage !== 'all') search.set('usage', filters.usage)
  if (filters.q) search.set('q', filters.q)
  if (filters.includeArchived) search.set('include_archived', 'true')
  const query = search.toString()
  return apiGet<ManagedFile[]>(`/management/files${query ? `?${query}` : ''}`, token)
}

export function uploadManagementFile(token: string, payload: ManagedFileUploadPayload) {
  const formData = new FormData()
  formData.append('file', payload.file)
  formData.append('usage', payload.usage)
  if (payload.tags?.trim()) formData.append('tags', payload.tags.trim())

  return apiUploadForm<ManagedFile>('/management/files', formData, token)
}

export function updateManagementFile(id: number, payload: ManagedFileUpdate, token: string) {
  return apiPut<ManagedFile, ManagedFileUpdate>(`/management/files/${id}`, payload, token)
}

export function setManagementFileActive(id: number, isActive: boolean, token: string) {
  return apiPatch<ManagedFile, { is_active: boolean }>(`/management/files/${id}/active`, { is_active: isActive }, token)
}

export function downloadManagementFile(id: number, token: string) {
  return apiDownload(`/management/files/${id}/download`, token)
}
