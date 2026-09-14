import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const viewSource = await readFile(new URL('./SearchResultsView.vue', import.meta.url), 'utf8')
const apiSource = await readFile(new URL('../api/catalog.ts', import.meta.url), 'utf8')

test('global search requests and renders all four public content types', () => {
  for (const request of ['getProducts', 'getSolutions', 'getDeliveryCases', 'getNews']) {
    assert.match(viewSource, new RegExp(`${request}\\(\\{ q: searchQuery`))
  }
  assert.match(viewSource, /rankedProducts/)
  assert.match(viewSource, /rankedSolutions/)
  assert.match(viewSource, /rankedDeliveryCases/)
  assert.match(viewSource, /rankedNewsArticles/)
})

test('catalog APIs forward fuzzy query parameters for every searchable list', () => {
  assert.equal((apiSource.match(/if \(params\.q\) search\.set\('q', params\.q\)/g) ?? []).length, 4)
})

test('product code queries use normalized exact code matching in global results', () => {
  assert.match(viewSource, /\^p\\d\+\$/)
  assert.match(viewSource, /sourceProduct\.product_code/)
  assert.match(viewSource, /\? 100 : 0/)
})
