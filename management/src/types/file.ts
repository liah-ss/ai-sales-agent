export interface ManagedFile {
  id: number
  original_name: string
  stored_name: string
  url: string
  content_type: string
  size: number
  usage: string
  tags: string | null
  uploaded_by_id: number
  uploaded_by_username: string
  is_active: boolean
  created_at: string
}

export interface ManagedFileUpdate {
  usage: string
  tags: string | null
  is_active: boolean
}

export interface ManagedFileFilters {
  usage?: string
  q?: string
  includeArchived?: boolean
}

export interface ManagedFileUploadPayload {
  file: File
  usage: string
  tags?: string
}

export interface MaterialFolder {
  key: string
  name: string
  usage: string | null
  archived?: boolean
}
