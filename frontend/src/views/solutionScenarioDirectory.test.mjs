import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const detailSource = await readFile(new URL('./SolutionDetailView.vue', import.meta.url), 'utf8')
const listingSource = await readFile(new URL('./SolutionsView.vue', import.meta.url), 'utf8')
const styleSource = await readFile(new URL('../style.css', import.meta.url), 'utf8')

test('solution pages use the shared chapter-directory structure', () => {
  for (const source of [detailSource, listingSource]) {
    assert.match(source, /class="scenario-directory-heading"/)
    assert.match(source, /class="scenario-directory-list"/)
    assert.match(source, /String\([^)]*length\)\.padStart\(2, '0'\)/)
    assert.match(source, /String\(index \+ 1\)\.padStart\(2, '0'\)/)
  }
})

test('directory exposes the active solution to assistive technology', () => {
  assert.match(detailSource, /:aria-current="item\.slug === localizedSolution\.slug \? 'page' : undefined"/)
  assert.match(listingSource, /:aria-current="activeSlug === solution\.slug \? 'page' : undefined"/)
  assert.match(listingSource, /:to="`\/solutions\/\$\{solution\.slug\}`"/)
})

test('directory becomes a full-width horizontally scrollable chapter strip on mobile', () => {
  const directoryLayer = styleSource.slice(styleSource.lastIndexOf('/* Solution chapter directory */'))
  assert.match(directoryLayer, /@media \(max-width: 768px\)[\s\S]*?\.scenario-detail-shell\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/)
  assert.match(directoryLayer, /\.scenario-directory-list\s*\{[\s\S]*?display:\s*flex;[\s\S]*?overflow-x:\s*auto;/)
  assert.match(directoryLayer, /scroll-snap-type:\s*inline proximity/)
})
