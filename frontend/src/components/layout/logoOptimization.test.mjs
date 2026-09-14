import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const headerSource = await readFile(new URL('./AppHeader.vue', import.meta.url), 'utf8')
const footerSource = await readFile(new URL('./AppFooter.vue', import.meta.url), 'utf8')
const dockerfileSource = await readFile(new URL('../../../../frontend/Dockerfile', import.meta.url), 'utf8')
const nginxSource = await readFile(new URL('../../../../deploy/nginx/examplecorp.conf', import.meta.url), 'utf8')

test('logo URLs use the configured public asset origin in every build mode', () => {
  assert.match(headerSource, /const productionLogoUrl = computed\(\(\) => logoUrl\.value\)/)
  assert.match(footerSource, /const productionLogoUrl = computed\(\(\) => logoUrl\.value\)/)
  assert.match(headerSource, /width="220" height="50"/)
  assert.match(footerSource, /width="240" height="54"/)
  assert.match(dockerfileSource, /ENV NUXT_PUBLIC_ASSET_BASE_URL=\$NUXT_PUBLIC_ASSET_BASE_URL/)
  assert.match(dockerfileSource, /ENV VITE_ASSET_BASE_URL=\$VITE_ASSET_BASE_URL/)
})

test('static deployment keeps the optimized logo cache routes available', () => {
  assert.match(nginxSource, /location = \/media\/logo-site\.webp \{[\s\S]*?max-age=31536000, immutable/)
  assert.match(nginxSource, /location = \/media\/logo-footer\.webp \{[\s\S]*?max-age=31536000, immutable/)
})
