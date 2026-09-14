import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const viewSource = await readFile(new URL('../../views/CatalogManageView.vue', import.meta.url), 'utf8')
const storeSource = await readFile(new URL('../../stores/catalogManagement.ts', import.meta.url), 'utf8')
const apiSource = await readFile(new URL('../../api/catalogManagement.ts', import.meta.url), 'utf8')
const paginationSource = await readFile(new URL('./CatalogPagination.vue', import.meta.url), 'utf8')
const tableSource = await readFile(new URL('./CatalogTable.vue', import.meta.url), 'utf8')

test('management product library loads one 24-row page from the server', () => {
  assert.match(storeSource, /const PRODUCT_PAGE_SIZE = 24/)
  assert.match(storeSource, /async function loadProductsPage/)
  assert.match(apiSource, /search\.set\('page_size', String\(params\.pageSize\)\)/)
  assert.match(apiSource, /ManagementProductListResponse/)
  assert.doesNotMatch(viewSource, /filterManagementProducts/)
})

test('management product library renders page controls and lazy page transitions', () => {
  assert.match(viewSource, /<CatalogPagination/)
  assert.match(viewSource, /store\.loadProductsPage\(requireToken\(\), \{ page \}\)/)
  assert.match(paginationSource, /const visiblePages = computed/)
  assert.match(paginationSource, /aria-current="item === currentPage \? 'page' : undefined"/)
})

test('management pagination keeps edge pages and collapses middle pages', () => {
  assert.match(paginationSource, /'ellipsis-start'/)
  assert.match(paginationSource, /'ellipsis-end'/)
  assert.match(paginationSource, /management-pagination-ellipsis/)
})

test('management product table hides the additional information column', () => {
  assert.match(tableSource, /<th v-if="props\.kind !== 'products'">附加信息<\/th>/)
  assert.match(tableSource, /<td v-if="props\.kind !== 'products'">\{\{ extraFor\(item\) \}\}<\/td>/)
})

test('category editor keeps hierarchy details out of the edit form', async () => {
  const editorSource = await readFile(new URL('./CatalogEditor.vue', import.meta.url), 'utf8')
  const localizedSource = await readFile(new URL('./LocalizedCatalogFields.vue', import.meta.url), 'utf8')
  const englishSource = await readFile(new URL('./EnglishTranslationPanel.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(editorSource, /分类层级已锁定/)
  assert.doesNotMatch(editorSource, /category-parent-lock/)
  assert.doesNotMatch(localizedSource, /默认物流方式/)
  const categoryPanel = localizedSource.match(/<template v-if="kind === 'categories'">[\s\S]*?<\/template>/)?.[0] ?? ''
  assert.doesNotMatch(categoryPanel, /交付标题|交付文案|FulfillmentItemsEditor/)
  assert.match(englishSource, /v-if="kind === 'categories'">分类名称/)
  assert.match(editorSource, /:kind="kind"/)
})
