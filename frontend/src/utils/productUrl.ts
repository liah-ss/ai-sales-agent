export function publicProductSlug(product: { slug: string; public_slug?: string }) {
  const slug = product.public_slug || product.slug
  return slug.endsWith('.html') ? slug : `${slug}.html`
}

export function publicProductPath(product: { slug: string; public_slug?: string }) {
  return `/products/${publicProductSlug(product)}`
}
