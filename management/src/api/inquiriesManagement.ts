import { apiDelete, apiGet, apiPatch, apiPost } from './client'
import type { InquiryStatus, ManagementInquiry } from '../types/inquiry'

export function getManagementInquiries(token: string, params: { status?: string; q?: string } = {}) {
  const search = new URLSearchParams()
  if (params.status && params.status !== 'all') search.set('status', params.status)
  if (params.q) search.set('q', params.q)
  const query = search.toString()
  return apiGet<ManagementInquiry[]>(`/management/inquiries${query ? `?${query}` : ''}`, token)
}

export function updateManagementInquiryStatus(id: number, status: InquiryStatus, token: string) {
  return apiPatch<ManagementInquiry, { status: InquiryStatus }>(`/management/inquiries/${id}/status`, { status }, token)
}

export function addManagementInquiryNote(id: number, note: string, token: string) {
  return apiPost<ManagementInquiry, { note: string }>(`/management/inquiries/${id}/notes`, { note }, token)
}

export function deleteManagementInquiry(id: number, token: string) {
  return apiDelete(`/management/inquiries/${id}`, token)
}
