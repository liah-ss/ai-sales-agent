export type AnalyticsPageType = 'all' | 'product' | 'solution' | 'about' | 'contact' | 'other'
export type AnalyticsPeriodPreset = 'previous_month' | 'this_month' | 'this_week' | 'previous_week' | 'this_year'

export interface AnalyticsDailyRow {
  date: string
  visits_pv: number
  visits_uv: number
  product_page_pv: number
  product_page_uv: number
  solution_page_pv: number
  solution_page_uv: number
  about_page_pv: number
  about_page_uv: number
  contact_page_pv: number
  contact_page_uv: number
}

export interface AnalyticsReport {
  start_date: string
  end_date: string
  rows: AnalyticsDailyRow[]
}

export interface PageViewLog {
  id: number
  visitor_id: string
  session_id: string
  page_type: Exclude<AnalyticsPageType, 'all'>
  path: string
  page_title: string | null
  ip_address: string
  referrer: string | null
  user_agent: string | null
  language: string | null
  screen_size: string | null
  is_bot: boolean
  created_at: string
}

export interface PageViewLogList {
  items: PageViewLog[]
  total: number
  page: number
  page_size: number
}

export interface AnalyticsFilters {
  startDate: string
  endDate: string
  pageType?: AnalyticsPageType
  query?: string
  page?: number
  pageSize?: number
}
