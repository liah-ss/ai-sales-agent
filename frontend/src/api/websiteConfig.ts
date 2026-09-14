import { apiGet } from './client'
import { cachedRequest } from './requestCache'
import type { WebsiteConfigPayload } from '../types/websiteConfig'

export function getWebsiteConfig() {
  return cachedRequest('website:/website-config', () => apiGet<WebsiteConfigPayload>('/website-config'))
}
