import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const contactSource = await readFile(new URL('./ContactView.vue', import.meta.url), 'utf8')
const contactPageSource = await readFile(new URL('../pages/[locale]/contact.vue', import.meta.url), 'utf8')
const inquiryApiSource = await readFile(new URL('../api/inquiries.ts', import.meta.url), 'utf8')
const whatsappSource = await readFile(new URL('../utils/whatsapp.ts', import.meta.url), 'utf8')

test('contact inquiry uses primary and secondary product category selectors', () => {
  assert.match(contactSource, /v-model="selectedPrimaryCategorySlug"/)
  assert.match(contactSource, /v-model="form\.product_slug"/)
  assert.match(contactSource, /secondaryCategories/)
  assert.match(contactSource, /handlePrimaryCategoryChange/)
})

test('contact inquiry submits through the POST API and displays its submission number', () => {
  assert.match(contactSource, /@submit\.prevent="submitInquiry"/)
  assert.match(inquiryApiSource, /apiPost<InquiryResponse/)
  assert.match(inquiryApiSource, /submission_number: string/)
  assert.match(contactSource, /inquiry\.submission_number/)
})

test('contact options are prerendered without loading the full product catalog', () => {
  assert.match(contactPageSource, /await useAsyncData/)
  assert.match(contactPageSource, /\/api\/categories/)
  assert.match(contactPageSource, /\/api\/solutions/)
  assert.match(contactPageSource, /\/api\/site-settings/)
  assert.doesNotMatch(contactSource, /getProducts/)
  assert.doesNotMatch(contactSource, /pageSize:\s*500/)
})

test('multi-product inquiries preserve every selected product in the message and WhatsApp context', () => {
  assert.match(contactSource, /Promise\.allSettled\(slugs\.map\(slug => getProduct\(slug\)\)\)/)
  assert.match(contactSource, /contact\.selectedProductsMessage/)
  assert.match(contactSource, /productNames: selectedProductSlugs\.value\.length > 1/)
  assert.match(contactSource, /productSlugs: selectedProductSlugs\.value\.length > 1/)
  assert.match(whatsappSource, /Products: \$\{context\.productNames\.join\(', '\)\}/)
  assert.match(whatsappSource, /Product URLs:/)
})
