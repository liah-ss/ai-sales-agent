export type OperationLogValue = Record<string, unknown> | unknown[] | null

export interface OperationLogSummary {
  id: number
  admin_user_id: number | null
  admin_username: string
  module: string
  action: string
  created_at: string
}

export interface OperationLog extends OperationLogSummary {
  before_data: OperationLogValue
  after_data: OperationLogValue
}

export interface OperationLogFilters {
  module?: string
  q?: string
  limit?: number
}

export interface OperationLogBatchDeleteResult {
  deletedIds: number[]
  deletedCount: number
}
