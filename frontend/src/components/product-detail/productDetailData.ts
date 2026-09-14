import type { AssuranceItem as CatalogAssuranceItem, FulfillmentItem, Product } from '../../types/catalog'

export interface PriceBreak {
  label?: string
  quantity: string
  price: string
  surprise?: boolean
}

export type AssuranceItem = CatalogAssuranceItem

export interface CapabilityMetric {
  value: string
  label: string
}

export interface PriceBreakLabels {
  tier1: string
  tier2: string
  tier3: string
  tier1Range: string
  tier1Price: string
  tier2Range: string
  tier2Price: string
  surpriseInquiry: string
}

export interface AssuranceLabels {
  warrantyTitle: string
  warrantyCopy: string
  maintenanceTitle: string
  maintenanceCopy: string
}

export interface CapabilityLabels {
  quoteResponse: string
  deliveryRegions: string
  coreCategories: string
  beforeShipment: string
}

export interface ProductSummarySections {
  applicationScenario: string
  functionalSummary: string
}

const applicationScenarioLabel = /^(?:应用场景|application scenarios?|aplikasi)\s*[:：]/i
const functionalSummaryLabel = /(?:功能用途|functional\s+(?:purpose|use)|functionality|fungsi(?:\s+(?:utama|dan\s+kegunaan)|\s*&\s*(?:tujuan|penggunaan))?)\s*[:：]/i

export function splitProductSummary(summary: string): ProductSummarySections {
  const normalized = summary.trim()
  if (!normalized || !applicationScenarioLabel.test(normalized)) {
    return { applicationScenario: '', functionalSummary: normalized }
  }

  const sectionBreak = normalized.search(new RegExp(`\\s+(?=${functionalSummaryLabel.source})`, 'i'))
  if (sectionBreak < 0) {
    return { applicationScenario: normalized, functionalSummary: '' }
  }

  return {
    applicationScenario: normalized.slice(0, sectionBreak).trim(),
    functionalSummary: normalized.slice(sectionBreak).trim(),
  }
}

export function getProductPriceBreaks(
  product: Product,
  labels: PriceBreakLabels,
): PriceBreak[] {
  const surprise = [{ price: labels.surpriseInquiry, quantity: labels.surpriseInquiry, surprise: true }]
  if (product.show_surprise_only) return surprise

  if (product.price_tiers?.length) {
    const visibleTiers = product.price_tiers.filter(tier => tier.visible !== false && tier.range.trim() && tier.price.trim())
    if (!visibleTiers.length) return surprise
    return visibleTiers.map(tier => ({
      label: tier.label,
      quantity: tier.range,
      price: tier.price,
      surprise: tier.range === labels.surpriseInquiry || tier.price === labels.surpriseInquiry,
    }))
  }

  return surprise
}

function fulfillmentItems(items: FulfillmentItem[] | undefined) {
  return (items ?? []).map(item => ({ name: item.name.trim(), copy: item.copy?.trim() ?? '' })).filter(item => item.name)
}

function legacyFulfillmentItems(items: string[] | undefined) {
  return (items ?? []).map(name => ({ name: name.trim(), copy: '' })).filter(item => item.name)
}

export function resolveProductFulfillmentItems(product: Pick<Product, 'fulfillment_items' | 'fulfillment_methods'>) {
  const productItems = fulfillmentItems(product.fulfillment_items)
  if (productItems.length) return productItems
  const legacyProductItems = legacyFulfillmentItems(product.fulfillment_methods)
  if (legacyProductItems.length) return legacyProductItems
  return []
}

export function getProductCertifications(product: Product) {
  const certificationValue = findSpecificationValue(product, ['certification', 'standard', '认证', '标准', 'sertifikasi', 'standar'])
  const base = certificationValue
    ? certificationValue.split(/[，,;/]/).map(item => item.trim()).filter(Boolean)
    : ['IEC', 'ISO9001', 'Factory test report']

  return Array.from(new Set(base)).slice(0, 5)
}

export function getAssuranceItems(labels: AssuranceLabels): AssuranceItem[] {
  return normalizeAssuranceItems([
    {
      title: labels.warrantyTitle,
      copy: labels.warrantyCopy,
    },
    {
      title: labels.maintenanceTitle,
      copy: labels.maintenanceCopy,
    },
  ])
}

export function normalizeAssuranceItems(items: AssuranceItem[]) {
  return items.map(item => {
    const sourceTitle = item.title.trim()
    const match = item.duration ? null : sourceTitle.match(/\d+\s*年/)
    return {
      duration: (item.duration || match?.[0] || '').trim().replace(/\s+(?=年)/g, ''),
      title: match ? sourceTitle.replace(match[0], '').trim() : sourceTitle,
      copy: item.copy ?? '',
    }
  })
}

export function getCapabilityMetrics(labels: CapabilityLabels): CapabilityMetric[] {
  return [
    { value: '24h', label: labels.quoteResponse },
    { value: '30+', label: labels.deliveryRegions },
    { value: '4', label: labels.coreCategories },
    { value: 'QC', label: labels.beforeShipment },
  ]
}

function findSpecificationValue(product: Product, keywords: string[]) {
  return product.specifications.find(row => {
    const label = row.label.toLowerCase()
    return keywords.some(keyword => label.includes(keyword.toLowerCase()))
  })?.value
}
