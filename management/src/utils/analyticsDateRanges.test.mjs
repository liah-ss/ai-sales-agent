import assert from 'node:assert/strict'
import test from 'node:test'
import { getAnalyticsDateRange } from './analyticsDateRanges.ts'

const thursday = new Date(2026, 6, 23, 15, 30)

test('analytics presets use calendar periods and default week starts on Monday', () => {
  assert.deepEqual(getAnalyticsDateRange('this_week', thursday), { startDate: '2026-07-20', endDate: '2026-07-23' })
  assert.deepEqual(getAnalyticsDateRange('previous_week', thursday), { startDate: '2026-07-13', endDate: '2026-07-19' })
  assert.deepEqual(getAnalyticsDateRange('this_month', thursday), { startDate: '2026-07-01', endDate: '2026-07-23' })
  assert.deepEqual(getAnalyticsDateRange('previous_month', thursday), { startDate: '2026-06-01', endDate: '2026-06-30' })
  assert.deepEqual(getAnalyticsDateRange('this_year', thursday), { startDate: '2026-01-01', endDate: '2026-07-23' })
})

test('previous month handles January year rollover', () => {
  assert.deepEqual(getAnalyticsDateRange('previous_month', new Date(2026, 0, 5)), {
    startDate: '2025-12-01',
    endDate: '2025-12-31',
  })
})
