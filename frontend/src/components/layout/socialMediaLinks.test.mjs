import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const headerSource = await readFile(new URL('./AppHeader.vue', import.meta.url), 'utf8')
const menuSource = await readFile(new URL('./MobileMenu.vue', import.meta.url), 'utf8')
const socialLinksSource = await readFile(new URL('./SocialMediaLinks.vue', import.meta.url), 'utf8')

test('header social links use the managed Facebook and LinkedIn URLs', () => {
  assert.match(headerSource, /siteSettings\?\.facebook_url\?\.trim\(\)/)
  assert.match(headerSource, /siteSettings\?\.linkedin_url\?\.trim\(\)/)
  assert.match(headerSource, /<SocialMediaLinks :facebook-url="facebookUrl" :linkedin-url="linkedinUrl"/)
})

test('social links open safely and are available in the mobile menu', () => {
  assert.match(socialLinksSource, /v-if="facebookUrl"/)
  assert.match(socialLinksSource, /v-if="linkedinUrl"/)
  assert.match(socialLinksSource, /rel="noopener noreferrer"/)
  assert.match(socialLinksSource, /aria-label="Facebook"/)
  assert.match(socialLinksSource, /aria-label="LinkedIn"/)
  assert.match(menuSource, /<SocialMediaLinks :facebook-url="facebookUrl" :linkedin-url="linkedinUrl" mobile/)
})

test('Facebook and LinkedIn marks use the same visual dimensions', () => {
  assert.match(socialLinksSource, /\.social-media-mark\s*\{[^}]*width:\s*18px;[^}]*height:\s*18px;[^}]*font-size:\s*15px;/s)
  assert.doesNotMatch(socialLinksSource, /\.facebook-mark\s*\{[^}]*font-size:/s)
  assert.doesNotMatch(socialLinksSource, /\.linkedin-mark\s*\{[^}]*font-size:/s)
})

test('Facebook and LinkedIn links use the same background', () => {
  assert.match(socialLinksSource, /\.social-media-link\s*\{[^}]*background:\s*#1b6d86;/s)
  assert.doesNotMatch(socialLinksSource, /\.facebook\s*\{[^}]*background:/s)
  assert.doesNotMatch(socialLinksSource, /\.linkedin\s*\{[^}]*background:/s)
})
