import assert from 'node:assert/strict'
import test from 'node:test'
import { buildWhatsAppLink, normalizeWhatsAppNumber } from './whatsapp.ts'

test('WhatsApp uses the managed number without a hard-coded fallback', () => {
  assert.equal(normalizeWhatsAppNumber('0852-4453-4610'), '085244534610')
  assert.match(buildWhatsAppLink('0852-4453-4610'), /^https:\/\/wa\.me\/085244534610\?text=/)
})

test('empty managed WhatsApp number produces no link', () => {
  assert.equal(normalizeWhatsAppNumber(''), '')
  assert.equal(buildWhatsAppLink(''), '')
  assert.equal(buildWhatsAppLink(null), '')
})

test('numeric legacy values are normalized safely', () => {
  assert.equal(normalizeWhatsAppNumber(11111111111), '11111111111')
  assert.match(buildWhatsAppLink(11111111111), /^https:\/\/wa\.me\/11111111111\?text=/)
})
