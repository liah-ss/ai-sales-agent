import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const routerSource = await readFile(new URL('../router/index.ts', import.meta.url), 'utf8')
const footerSource = await readFile(new URL('../components/layout/AppFooter.vue', import.meta.url), 'utf8')
const viewSource = await readFile(new URL('./PrivacyPolicyView.vue', import.meta.url), 'utf8')
const contentSource = await readFile(new URL('../components/legal/PrivacyPolicyContent.vue', import.meta.url), 'utf8')
const policySource = await readFile(new URL('../data/privacyPolicyContent.ts', import.meta.url), 'utf8')

test('footer privacy link opens the dedicated privacy policy route', () => {
  assert.match(footerSource, /to="\/privacy-policy"/)
  assert.match(routerSource, /path: 'privacy-policy', name: 'privacy-policy'/)
  assert.match(routerSource, /PrivacyPolicyView\.vue/)
})

test('privacy page follows the active locale and renders structured document content', () => {
  assert.match(viewSource, /privacyPolicyContent\[locale\.value\]/)
  assert.match(viewSource, /<PrivacyPolicyContent :document="policy"/)
  assert.match(contentSource, /v-for="section in document\.sections"/)
})

test('privacy policy provides complete Chinese, English, and Indonesian documents', () => {
  assert.match(policySource, /'zh-CN': \{/)
  assert.match(policySource, /title: 'Privacy Policy'/)
  assert.match(policySource, /title: 'Kebijakan Privasi'/)
  assert.equal((policySource.match(/title: '(?:一、|二、|三、|四、|五、|六、|七、|八、|九、|十、|十一、)/g) ?? []).length, 11)
  assert.equal((policySource.match(/title: '\d+\./g) ?? []).length, 22)
  assert.match(policySource, /Law No\. 27 of 2022/)
  assert.match(policySource, /Undang-Undang No\. 27 Tahun 2022/)
})
