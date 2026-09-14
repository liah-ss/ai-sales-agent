export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const siteUrl = String(config.public.siteUrl).replace(/\/$/, '')
  const aiCrawlers = [
    'OAI-SearchBot',
    'ChatGPT-User',
    'GPTBot',
    'Claude-SearchBot',
    'ClaudeBot',
    'PerplexityBot',
    'Google-Extended',
    'Applebot-Extended',
    'Bytespider',
    'Meta-ExternalAgent',
    'CCBot',
  ]
  const rules = [
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /management/',
  ]
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600')
  return [
    ...aiCrawlers.flatMap(crawler => [`User-agent: ${crawler}`, ...rules, '']),
    'User-agent: *',
    ...rules,
    `Sitemap: ${siteUrl}/sitemap.xml`,
    `Host: ${new URL(siteUrl).host}`,
    '',
  ].join('\n')
})
