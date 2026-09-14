import { apiPost, apiPostForm } from './client'

export interface InquiryPayload {
  name: string
  company: string
  email?: string
  phone?: string
  product_slug?: string
  solution_slug?: string
  message: string
  source_page: string
  attachment?: File | null
}

export interface InquiryResponse {
  id: number
  submission_number: string
  name: string
  company: string
  email: string | null
  phone: string | null
  attachment_url: string | null
  attachment_name: string | null
  attachment_content_type: string | null
  product_slug: string | null
  solution_slug: string | null
  message: string
  source_page: string
  status: string
  crm_status: string
  created_at: string
}

export function createInquiry(payload: InquiryPayload) {
  if (payload.attachment) {
    const formData = new FormData()
    formData.append('name', payload.name)
    formData.append('company', payload.company)
    if (payload.email) formData.append('email', payload.email)
    if (payload.phone) formData.append('phone', payload.phone)
    if (payload.product_slug) formData.append('product_slug', payload.product_slug)
    if (payload.solution_slug) formData.append('solution_slug', payload.solution_slug)
    formData.append('message', payload.message)
    formData.append('source_page', payload.source_page)
    formData.append('attachment', payload.attachment)
    return apiPostForm<InquiryResponse>('/inquiries', formData)
  }

  return apiPost<InquiryResponse, InquiryPayload>('/inquiries', payload)
}
