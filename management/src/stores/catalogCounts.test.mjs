import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('./catalogManagement.ts', import.meta.url), 'utf8')
const apiSource = await readFile(new URL('../api/catalogManagement.ts', import.meta.url), 'utf8')

test('catalog summary counts load independently of the active catalog table', () => {
  assert.match(apiSource, /management\/catalog\/counts/)
  assert.match(source, /const countsPromise = loadCounts\(token, force\)/)
  assert.match(source, /productCatalogTotal\.value = response\.products/)
  assert.match(source, /activeProductTotal\.value = response\.active_products/)
  assert.match(source, /await countsPromise/)
})
