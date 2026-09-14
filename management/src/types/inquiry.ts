export type InquiryStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost' | 'archived'

export interface InquiryNote {
  id: number
  inquiry_id: number
  admin_user_id: number
  note: string
  created_at: string
  admin_username: string
}

export interface ManagementInquiry {
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
  product_code: string | null
  solution_slug: string | null
  message: string
  source_page: string
  status: InquiryStatus
  crm_status: 'pending' | 'retrying' | 'synced' | 'failed' | 'not_configured'
  crm_attempts: number
  crm_last_error: string | null
  crm_synced_at: string | null
  created_at: string
  notes: InquiryNote[]
}
