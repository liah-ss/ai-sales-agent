import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const analyticsSource = await readFile(new URL('./plugins/analytics.client.ts', import.meta.url), 'utf8')
const webVitalsSource = await readFile(new URL('./plugins/web-vitals.client.ts', import.meta.url), 'utf8')
const composeSource = await readFile(new URL('../../docker-compose.yml', import.meta.url), 'utf8')

test('non-critical browser telemetry is delayed without losing short visits', () => {
  assert.match(analyticsSource, /window\.setTimeout\(reportPendingPage, 3_000\)/)
  assert.match(analyticsSource, /pagehide/)
  assert.match(webVitalsSource, /import\('web-vitals'\)/)
  assert.match(webVitalsSource, /}, 5_000\)/)
})

test('production backend defaults to two uvicorn workers', () => {
  assert.match(composeSource, /--workers.*BACKEND_WORKERS:-2/)
})
