import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const authSource = await readFile(new URL('./auth.ts', import.meta.url), 'utf8')
const clientSource = await readFile(new URL('../api/client.ts', import.meta.url), 'utf8')

test('management auth restores and validates the stored session', () => {
  assert.match(authSource, /localStorage\.getItem\(TOKEN_STORAGE_KEY\)/)
  assert.match(authSource, /localStorage\.setItem\(TOKEN_STORAGE_KEY, response\.access_token\)/)
  assert.match(authSource, /getCurrentUser\(storedToken\)/)
  assert.match(authSource, /localStorage\.removeItem\(TOKEN_STORAGE_KEY\)/)
  assert.doesNotMatch(authSource, /localStorage\.removeItem\('examplecorp_management_token'\)/)
})

test('management auth only clears a stored token when the API rejects authorization', () => {
  assert.match(authSource, /error instanceof ApiError && \[401, 403\]\.includes\(error\.status\)/)
  assert.match(authSource, /if \(error instanceof ApiError[\s\S]*localStorage\.removeItem\(TOKEN_STORAGE_KEY\)/)
  assert.doesNotMatch(authSource, /catch \{\s*localStorage\.removeItem\(TOKEN_STORAGE_KEY\)/)
})

test('API errors preserve backend detail for actionable save feedback', () => {
  assert.match(clientSource, /await response\.json\(\)/)
  assert.match(clientSource, /payload\.detail/)
  assert.match(clientSource, /new ApiError\(message, response\.status\)/)
})
