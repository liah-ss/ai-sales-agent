import assert from 'node:assert/strict'

const apiBaseUrl = (process.env.GEO_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')
const strict = process.env.GEO_REQUIRE_COMPLETE === '1'
const minimumFieldCoverage = Number(process.env.GEO_MIN_FIELD_COVERAGE || 0.95)
const minimumEvidenceCoverage = Number(process.env.GEO_MIN_EVIDENCE_COVERAGE || 1)

const fieldDefinitions = [
  { key: 'answer_summary', label: 'answer', present: textPresent },
  { key: 'standards', label: 'standards', present: listPresent },
  { key: 'applicable_markets', label: 'markets', present: listPresent },
  { key: 'unsuitable_conditions', label: 'limits', present: listPresent },
  { key: 'evidence_urls', label: 'evidence', present: listPresent },
  { key: 'author_name', label: 'author', present: textPresent },
  { key: 'technical_reviewer', label: 'reviewer', present: textPresent },
]

function textPresent(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function listPresent(value) {
  return Array.isArray(value) && value.some(item => textPresent(String(item ?? '')))
}

async function getJson(path) {
  const response = await fetch(`${apiBaseUrl}${path}`, { signal: AbortSignal.timeout(20_000) })
  assert.equal(response.status, 200, `${path}: expected 200, received ${response.status}`)
  return response.json()
}

async function getPaged(path) {
  const first = await getJson(`${path}?page=1`)
  const items = [...first.items]
  const pages = Math.ceil(first.total / first.page_size)
  for (let page = 2; page <= pages; page += 1) {
    const response = await getJson(`${path}?page=${page}&page_size=${first.page_size}`)
    items.push(...response.items)
  }
  return items
}

async function mapConcurrent(items, worker, concurrency = 8) {
  const results = new Array(items.length)
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index])
    }
  }))
  return results
}

const summariesByType = [
  { type: 'products', items: await getPaged('/products'), detailPath: slug => `/products/${encodeURIComponent(slug)}` },
  { type: 'solutions', items: await getJson('/solutions'), detailPath: slug => `/solutions/${encodeURIComponent(slug)}` },
  { type: 'delivery-cases', items: await getPaged('/delivery-cases'), detailPath: slug => `/delivery-cases/${encodeURIComponent(slug)}` },
  { type: 'news', items: await getPaged('/news'), detailPath: slug => `/news/${encodeURIComponent(slug)}` },
]

const contentGroups = await Promise.all(summariesByType.map(async ({ type, items, detailPath }) => ({
  type,
  items: await mapConcurrent(items, item => getJson(detailPath(item.slug))),
})))

const report = contentGroups.map(({ type, items }) => {
  const indexable = items.filter(item => item.is_indexable !== false)
  const coverage = Object.fromEntries(fieldDefinitions.map(field => [
    field.label,
    indexable.filter(item => field.present(item[field.key])).length,
  ]))
  const complete = indexable.filter(item => fieldDefinitions.every(field => field.present(item[field.key]))).length
  return { type, total: indexable.length, ...coverage, complete }
})

console.table(report)

const totals = report.reduce((result, row) => {
  result.total += row.total
  result.complete += row.complete
  for (const field of fieldDefinitions) result[field.label] += row[field.label]
  return result
}, {
  total: 0,
  complete: 0,
  ...Object.fromEntries(fieldDefinitions.map(field => [field.label, 0])),
})

const percent = value => totals.total ? `${((value / totals.total) * 100).toFixed(1)}%` : '0.0%'
console.log(`GEO content audit: ${totals.total} indexable records at ${apiBaseUrl}`)
for (const field of fieldDefinitions) console.log(`- ${field.label}: ${totals[field.label]}/${totals.total} (${percent(totals[field.label])})`)
console.log(`- complete: ${totals.complete}/${totals.total} (${percent(totals.complete)})`)

if (strict) {
  assert.ok(totals.total > 0, 'Strict GEO audit requires at least one indexable record')
  for (const field of fieldDefinitions) {
    const minimum = field.key === 'evidence_urls' ? minimumEvidenceCoverage : minimumFieldCoverage
    const coverage = totals[field.label] / totals.total
    assert.ok(coverage >= minimum, `${field.label} coverage ${(coverage * 100).toFixed(1)}% is below ${(minimum * 100).toFixed(1)}%`)
  }
}
