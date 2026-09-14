import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const headerSource = await readFile(new URL('./AppHeader.vue', import.meta.url), 'utf8')
const menuSource = await readFile(new URL('./MobileMenu.vue', import.meta.url), 'utf8')

test('mobile navigation exposes state and an accessible dialog relationship', () => {
  assert.match(headerSource, /aria-controls="mobile-navigation"/)
  assert.match(headerSource, /:aria-expanded="menuOpen"/)
  assert.match(menuSource, /id="mobile-navigation"/)
  assert.match(menuSource, /role="dialog"/)
  assert.match(menuSource, /aria-modal="true"/)
})

test('mobile navigation supports escape, focus trapping, and focus restoration', () => {
  assert.match(menuSource, /event\.key === 'Escape'/)
  assert.match(menuSource, /event\.key !== 'Tab'/)
  assert.match(menuSource, /previouslyFocused\?\.focus\(\)/)
  assert.match(menuSource, /focusableElements\(\)\[0\]\?\.focus\(\)/)
})
