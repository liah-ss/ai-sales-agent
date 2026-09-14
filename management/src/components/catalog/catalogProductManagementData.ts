import type {
  AssuranceItem,
  FulfillmentItem,
  ManagementCategorySummary,
  ManagementProduct,
  PriceTier,
  PriceTierInput,
  ProcessItem,
  ProductSpecification,
} from '../../types/catalog'

export function defaultProcessItems(): ProcessItem[] {
  return [
    { title: '需求确认', copy: '先核对应用场景、额定参数、数量和图纸。' },
    { title: '工厂匹配', copy: '审核供应商产能、证书和生产排期。' },
    { title: '订单交易', copy: '商务条款约定、商业合同签订、相关文件资料清单确认。' },
    { title: '发货管控', copy: '跟踪包装照片、验货记录和物流状态。' },
  ]
}

export function normalizeProcessItems(items: ProcessItem[] | undefined, useDefaults = true): ProcessItem[] {
  const source = items?.length ? items : useDefaults ? defaultProcessItems() : []
  return source.slice(0, 4).map(item => ({ title: item.title.trim(), copy: item.copy?.trim() ?? '' }))
}

export function cleanProcessItems(items: ProcessItem[]): ProcessItem[] {
  return items
    .slice(0, 4)
    .map(item => ({ title: item.title.trim(), copy: item.copy.trim() }))
    .filter(item => item.title)
}

export function defaultAssuranceItems(): AssuranceItem[] {
  return [
    { duration: '1年', title: '质保', copy: '整机质量保障与问题响应' },
    { duration: '3年', title: '运维', copy: '运行维护支持与技术协助' },
  ]
}

export function normalizeAssuranceItems(items: AssuranceItem[] | undefined) {
  if (!items?.length) return defaultAssuranceItems()
  return items.slice(0, 4).map(item => {
    const sourceTitle = item.title.trim()
    const match = item.duration ? null : sourceTitle.match(/\d+\s*年/)
    const duration = (item.duration || match?.[0] || '').replace(/\s+/g, '')
    const title = match ? sourceTitle.replace(match[0], '').trim() : sourceTitle
    return { duration, title, copy: item.copy?.trim() ?? '' }
  })
}

export function moveAssuranceItem(items: AssuranceItem[], index: number, direction: -1 | 1) {
  return moveListItem(items, index, direction).map(item => ({ ...item }))
}

export function moveListItem<T>(items: T[], index: number, direction: -1 | 1) {
  const targetIndex = index + direction
  if (index < 0 || index >= items.length || targetIndex < 0 || targetIndex >= items.length) return [...items]
  const next = [...items]
  ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
  return next
}

export function normalizePriceTiers(tiers: PriceTierInput[] | undefined): PriceTier[] {
  return (tiers ?? []).slice(0, 3).map(tier => ({
    label: tier.label?.trim() || undefined,
    range: tier.range.trim(),
    price: tier.price.trim(),
    visible: tier.visible !== false,
  }))
}

export function normalizeFulfillmentItems(
  items: FulfillmentItem[] | undefined,
  legacyMethods: string[] | undefined = [],
): FulfillmentItem[] {
  const source = items?.length
    ? items
    : (legacyMethods ?? []).map(name => ({ name, copy: '' }))
  return source.map(item => ({ name: item.name.trim(), copy: item.copy?.trim() ?? '' })).filter(item => item.name)
}

export function cleanHighlights(items: string[]) {
  return items.map(item => item.trim()).filter(Boolean)
}

export function cleanSpecifications(items: ProductSpecification[]) {
  return items
    .map(item => ({ label: item.label.trim(), value: item.value.trim() }))
    .filter(item => item.label || item.value)
}

export function cleanFulfillmentItems(items: FulfillmentItem[]) {
  return items
    .map(item => ({ name: item.name.trim(), copy: item.copy.trim() }))
    .filter(item => item.name || item.copy)
}

export function filterManagementProducts(products: ManagementProduct[], query: string) {
  const normalizedQuery = normalizeProductSearchText(query)
  if (!normalizedQuery) return products

  const normalizedCodeQuery = compactProductSearchText(normalizedQuery)
  if (/^p\d+$/u.test(normalizedCodeQuery)) {
    return products.filter(product => compactProductSearchText(
      normalizeProductSearchText(product.product_code),
    ) === normalizedCodeQuery)
  }

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean)
  return products.filter(product => {
    const searchableValues = [
      product.name,
      product.product_code,
      product.model,
      product.slug,
      product.summary,
      product.category.name,
      product.category.slug,
      JSON.stringify(product.translations ?? {}),
    ].map(normalizeProductSearchText)

    return queryTokens.every(token => {
      const compactToken = compactProductSearchText(token)
      return searchableValues.some(value => (
        value.includes(token)
        || compactProductSearchText(value).includes(compactToken)
      ))
    })
  })
}

function normalizeProductSearchText(value: unknown) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase().trim()
}

function compactProductSearchText(value: string) {
  return value.replace(/[^\p{L}\p{N}]+/gu, '')
}

export function getProductCategoryOptions(categories: ManagementCategorySummary[]) {
  return categories.filter(category => category.parent_id !== null)
}

export function productCategoryOptionLabel(category: ManagementCategorySummary, categories: ManagementCategorySummary[]) {
  const parentName = categories.find(item => item.id === category.parent_id)?.name
  return parentName ? `${parentName} / ${category.name}` : category.name
}

export function moveProductImage(images: string[], index: number, direction: -1 | 1) {
  const targetIndex = index + direction
  if (index < 0 || index >= images.length || targetIndex < 0 || targetIndex >= images.length) return [...images]
  const next = [...images]
  ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
  return next
}

export function setMainProductImage(images: string[], index: number) {
  if (index <= 0 || index >= images.length) return [...images]
  const next = [...images]
  const [selected] = next.splice(index, 1)
  next.unshift(selected)
  return next
}

export function serializeProductPriceTiers(_showSurpriseOnly: boolean, tiers: PriceTierInput[]) {
  return normalizePriceTiers(tiers)
}
