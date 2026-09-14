import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const clientSource = await readFile(new URL('./client.ts', import.meta.url), 'utf8')

test('all product assets, including batch 2, resolve through the COS asset base URL', () => {
  assert.match(clientSource, /FRONTEND_PUBLIC_ASSET_PREFIXES\.some\(prefix => url\.startsWith\(prefix\)\)/)
  assert.match(clientSource, /return ASSET_BASE_URL \? `\$\{ASSET_BASE_URL\}\$\{url\}` : url/)
  assert.doesNotMatch(clientSource, /startsWith\('\/product-assets\/batch-2\/'\)\) return url/)
})
