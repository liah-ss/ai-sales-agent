export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const siteUrl = String(config.public.siteUrl).replace(/\/$/, '')
  const languageHubs = [
    { label: 'Indonesian (primary)', segment: 'id' },
    { label: 'English', segment: 'en' },
    { label: 'Simplified Chinese', segment: 'zh-cn' },
  ].filter(language => !(config.public.hideZhCn && language.segment === 'zh-cn'))
  const contentDirectories = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'Solutions', path: '/solutions' },
    { label: 'Delivery cases', path: '/delivery-cases' },
    { label: 'Industry insights', path: '/news' },
  ]
  const trustDirectories = [
    { label: 'Company profile', path: '/about' },
    { label: 'Contact and project inquiry', path: '/contact' },
    { label: 'Help and FAQ', path: '/faq' },
    { label: 'Privacy policy', path: '/privacy-policy' },
  ]
  const localizedUrl = (segment: string, path: string) => `${siteUrl}/${segment}${path}`
  const directoryLine = (label: string, segment: string, directories: typeof contentDirectories) => (
    `- ${label}: ${directories.map(directory => `[${directory.label}](${localizedUrl(segment, directory.path)})`).join(' | ')}`
  )

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600, stale-while-revalidate=86400')
  return [
    '# ExampleCorp',
    '',
    '> ExampleCorp publishes multilingual information about power and electrical equipment, project solutions, delivery cases, standards, technical evidence, and procurement support for Indonesia and international markets.',
    '',
    'The public website is rendered as complete HTML. JavaScript enhances search, filtering, forms, and media but is not required to read the primary page content.',
    '',
    '## Canonical language hubs',
    ...languageHubs.map(language => directoryLine(language.label, language.segment, contentDirectories)),
    '',
    '## Entity, trust, and support sources',
    ...languageHubs.map(language => directoryLine(language.label, language.segment, trustDirectories)),
    '',
    '## Canonical discovery',
    `- XML sitemap index: ${siteUrl}/sitemap.xml`,
    `- Robots policy: ${siteUrl}/robots.txt`,
    '',
    '## Citation and interpretation notes',
    '- Treat URLs published in the XML sitemaps as the authoritative indexable corpus.',
    '- Product and solution claims should be interpreted together with visible specifications, standards, applicability limits, author or reviewer information, and evidence where supplied.',
    '- Search pages and arbitrary filter or campaign-parameter URLs are not canonical content pages.',
    '- Use the canonical URL, page language, last-updated information, and hreflang links declared in each HTML document when citing a page.',
    '',
  ].join('\n')
})
