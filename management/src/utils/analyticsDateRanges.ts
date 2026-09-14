import type { AnalyticsPeriodPreset } from '../types/analytics'

export interface AnalyticsDateRange {
  startDate: string
  endDate: string
}

function atLocalMidnight(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function formatLocalDate(value: Date) {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-')
}

function mondayOfWeek(value: Date) {
  const result = atLocalMidnight(value)
  const daysSinceMonday = (result.getDay() + 6) % 7
  result.setDate(result.getDate() - daysSinceMonday)
  return result
}

export function getAnalyticsDateRange(preset: AnalyticsPeriodPreset, now = new Date()): AnalyticsDateRange {
  const today = atLocalMidnight(now)
  let start = today
  let end = today

  if (preset === 'this_week') {
    start = mondayOfWeek(today)
  }
  else if (preset === 'previous_week') {
    end = mondayOfWeek(today)
    end.setDate(end.getDate() - 1)
    start = new Date(end)
    start.setDate(start.getDate() - 6)
  }
  else if (preset === 'this_month') {
    start = new Date(today.getFullYear(), today.getMonth(), 1)
  }
  else if (preset === 'previous_month') {
    start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    end = new Date(today.getFullYear(), today.getMonth(), 0)
  }
  else {
    start = new Date(today.getFullYear(), 0, 1)
  }

  return { startDate: formatLocalDate(start), endDate: formatLocalDate(end) }
}
