export interface WhatsAppContext {
  productName?: string
  productSlug?: string
  productNames?: string[]
  productSlugs?: string[]
  solutionName?: string
  solutionSlug?: string
  sourcePage?: string
}

export function normalizeWhatsAppNumber(number?: string | null) {
  return String(number || '').replace(/[^\d]/g, '')
}

export function buildWhatsAppMessage(context: WhatsAppContext = {}) {
  const lines = ['Hello ExampleCorp, I would like to request a quote.']

  if (context.productNames?.length) lines.push(`Products: ${context.productNames.join(', ')}`)
  else if (context.productName) lines.push(`Product: ${context.productName}`)

  if (context.productSlugs?.length) {
    lines.push(`Product URLs: ${context.productSlugs.map(slug => `/products/${slug}`).join(', ')}`)
  } else if (context.productSlug) {
    lines.push(`Product URL: /products/${context.productSlug}`)
  }
  if (context.solutionName) lines.push(`Solution: ${context.solutionName}`)
  if (context.solutionSlug) lines.push(`Solution URL: /solutions?solution=${context.solutionSlug}`)
  if (context.sourcePage) lines.push(`Source: ${context.sourcePage}`)

  lines.push('Requirements:')
  return lines.join('\n')
}

export function buildWhatsAppLink(number?: string | null, context: WhatsAppContext = {}) {
  const normalizedNumber = normalizeWhatsAppNumber(number)
  if (!normalizedNumber) return ''
  const text = encodeURIComponent(buildWhatsAppMessage(context))
  return `https://wa.me/${normalizedNumber}?text=${text}`
}
