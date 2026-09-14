import { getCategories, getProducts, getSolutions } from '../api/catalog'
import { getSiteSettings } from '../api/site'
import { getWebsiteConfig } from '../api/websiteConfig'

const PRODUCT_PAGE_SIZE = 24

let prefetchPromise: Promise<PromiseSettledResult<unknown>[]> | null = null

export function prefetchPublicData() {
  if (prefetchPromise) return prefetchPromise
  prefetchPromise = Promise.allSettled([
    getCategories(),
    getProducts({ page: 1, pageSize: PRODUCT_PAGE_SIZE }),
    getSolutions(),
    getSiteSettings(),
    getWebsiteConfig(),
  ])
  return prefetchPromise
}
