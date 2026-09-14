import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { ApiError } from '../api/client'
import {
  bulkCreateManagementCategories,
  bulkCreateManagementDeliveryCases,
  bulkCreateManagementNews,
  bulkCreateManagementProducts,
  bulkCreateManagementSolutions,
  createManagementCategory,
  createManagementDeliveryCase,
  createManagementNewsArticle,
  createManagementProduct,
  createManagementSolution,
  deleteManagementCategory,
  deleteManagementDeliveryCase,
  deleteManagementNewsArticle,
  deleteManagementProduct,
  deleteManagementSolution,
  getManagementCategories,
  getManagementCatalogCounts,
  getManagementCategory,
  getManagementDeliveryCases,
  getManagementDeliveryCase,
  getManagementNews,
  getManagementNewsArticle,
  getManagementProducts,
  getManagementProduct,
  getManagementSolutions,
  getManagementSolution,
  setManagementCategoryActive,
  setManagementDeliveryCaseActive,
  setManagementNewsArticleActive,
  setManagementProductActive,
  setManagementSolutionActive,
  updateManagementCategory,
  updateManagementDeliveryCase,
  updateManagementNewsArticle,
  updateManagementProduct,
  updateManagementSolution,
} from '../api/catalogManagement'
import type {
  CatalogKind,
  CategoryPayload,
  DeliveryCasePayload,
  ManagementCategorySummary,
  ManagementDeliveryCaseSummary,
  ManagementNewsArticleSummary,
  ManagementProductSummary,
  ManagementSolutionSummary,
  NewsArticlePayload,
  ProductPayload,
  SolutionPayload,
} from '../types/catalog'

export const useCatalogManagementStore = defineStore('catalog-management', () => {
  const PRODUCT_PAGE_SIZE = 24
  const categories = shallowRef<ManagementCategorySummary[]>([])
  const products = shallowRef<ManagementProductSummary[]>([])
  const solutions = shallowRef<ManagementSolutionSummary[]>([])
  const news = shallowRef<ManagementNewsArticleSummary[]>([])
  const deliveryCases = shallowRef<ManagementDeliveryCaseSummary[]>([])
  const isLoading = shallowRef(false)
  const isLoadingProducts = shallowRef(false)
  const isSaving = shallowRef(false)
  const error = shallowRef('')
  const lastSavedAt = shallowRef('')
  const productPage = shallowRef(1)
  const productPageSize = shallowRef(PRODUCT_PAGE_SIZE)
  const productTotal = shallowRef(0)
  const productCatalogTotal = shallowRef(0)
  const activeProductTotal = shallowRef(0)
  const categoryTotal = shallowRef(0)
  const solutionTotal = shallowRef(0)
  const newsTotal = shallowRef(0)
  const deliveryCaseTotal = shallowRef(0)
  const productQuery = shallowRef('')
  let countsLoaded = false

  const counts = computed(() => ({
    categories: categoryTotal.value,
    products: productCatalogTotal.value,
    solutions: solutionTotal.value,
    news: newsTotal.value,
    deliveryCases: deliveryCaseTotal.value,
    activeProducts: activeProductTotal.value,
  }))

  async function loadCounts(token: string, force = false) {
    if (countsLoaded && !force) return
    try {
      const response = await getManagementCatalogCounts(token)
      categoryTotal.value = response.categories
      productCatalogTotal.value = response.products
      activeProductTotal.value = response.active_products
      solutionTotal.value = response.solutions
      newsTotal.value = response.news
      deliveryCaseTotal.value = response.delivery_cases
      countsLoaded = true
    } catch {
      // The active table remains usable if the optional summary request fails.
    }
  }

  function applyProductPage(response: Awaited<ReturnType<typeof getManagementProducts>>) {
    products.value = response.items
    productPage.value = response.page
    productPageSize.value = response.page_size
    productTotal.value = response.total
    productCatalogTotal.value = response.all_total
    activeProductTotal.value = response.active_total
  }

  async function loadProductsPage(token: string, options: { page?: number; q?: string } = {}) {
    isLoadingProducts.value = true
    error.value = ''
    const page = options.page ?? productPage.value
    const q = options.q ?? productQuery.value
    try {
      const response = await getManagementProducts(token, {
        q: q.trim() || undefined,
        page,
        pageSize: PRODUCT_PAGE_SIZE,
      })
      productQuery.value = q.trim()
      applyProductPage(response)
      return response
    } catch {
      error.value = '无法加载产品分页数据。'
      return null
    } finally {
      isLoadingProducts.value = false
    }
  }

  async function loadProductDetail(id: number, token: string) {
    error.value = ''
    try {
      return await getManagementProduct(id, token)
    } catch {
      error.value = '无法加载产品详情。'
      return null
    }
  }

  async function loadItemDetail(kind: CatalogKind, id: number, token: string) {
    if (kind === 'products') return loadProductDetail(id, token)
    error.value = ''
    try {
      if (kind === 'categories') return await getManagementCategory(id, token)
      if (kind === 'solutions') return await getManagementSolution(id, token)
      if (kind === 'news') return await getManagementNewsArticle(id, token)
      return await getManagementDeliveryCase(id, token)
    } catch {
      error.value = '无法加载当前记录详情。'
      return null
    }
  }

  async function refreshProductPageAfterMutation(token: string, removedCount = 1) {
    const targetPage = Math.min(
      productPage.value,
      Math.max(1, Math.ceil(Math.max(0, productTotal.value - removedCount) / PRODUCT_PAGE_SIZE)),
    )
    await loadProductsPage(token, { page: targetPage })
  }

  const loadedKinds = new Set<CatalogKind>()

  async function loadKind(kind: CatalogKind, token: string, force = false) {
    if (!force && loadedKinds.has(kind)) return
    isLoading.value = true
    error.value = ''
    try {
      const countsPromise = loadCounts(token, force)
      if (kind === 'products') {
        const [categoryRows, productRows] = await Promise.all([
          categories.value.length ? Promise.resolve(categories.value) : getManagementCategories(token),
          getManagementProducts(token, { page: 1, pageSize: PRODUCT_PAGE_SIZE }),
        ])
        categories.value = categoryRows
        categoryTotal.value = categoryRows.length
        applyProductPage(productRows)
      } else if (kind === 'categories') {
        categories.value = await getManagementCategories(token)
        categoryTotal.value = categories.value.length
      } else if (kind === 'solutions') {
        solutions.value = await getManagementSolutions(token)
        solutionTotal.value = solutions.value.length
      } else if (kind === 'news') {
        news.value = await getManagementNews(token)
        newsTotal.value = news.value.length
      } else {
        deliveryCases.value = await getManagementDeliveryCases(token)
        deliveryCaseTotal.value = deliveryCases.value.length
      }
      await countsPromise
      loadedKinds.add(kind)
    } catch {
      error.value = '无法加载当前目录数据。'
    } finally {
      isLoading.value = false
    }
  }

  function stampSaved() {
    lastSavedAt.value = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date())
  }

  async function saveCategory(payload: CategoryPayload, token: string, id?: number) {
    isSaving.value = true
    error.value = ''
    try {
      const saved = id
        ? await updateManagementCategory(id, payload, token)
        : await createManagementCategory(payload, token)
      categories.value = id
        ? categories.value.map(item => (item.id === id ? saved : item))
        : [...categories.value, saved]
      categoryTotal.value = categories.value.length
      stampSaved()
      return saved
    } catch {
      error.value = 'Unable to save category. Check slug uniqueness and required fields.'
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function saveProduct(payload: ProductPayload, token: string, id?: number) {
    isSaving.value = true
    error.value = ''
    try {
      const saved = id
        ? await updateManagementProduct(id, payload, token)
        : await createManagementProduct(payload, token)
      await loadProductsPage(token, { page: id ? productPage.value : 1 })
      stampSaved()
      return saved
    } catch (saveError) {
      error.value = saveError instanceof ApiError
        ? `保存产品失败：${saveError.message}`
        : '保存产品失败：无法连接后台服务，请确认服务已启动后重试。'
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function saveSolution(payload: SolutionPayload, token: string, id?: number) {
    isSaving.value = true
    error.value = ''
    try {
      const saved = id
        ? await updateManagementSolution(id, payload, token)
        : await createManagementSolution(payload, token)
      solutions.value = id
        ? solutions.value.map(item => (item.id === id ? saved : item))
        : [...solutions.value, saved]
      solutionTotal.value = solutions.value.length
      stampSaved()
      return saved
    } catch {
      error.value = 'Unable to save solution. Check slug uniqueness and required fields.'
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function saveNewsArticle(payload: NewsArticlePayload, token: string, id?: number) {
    isSaving.value = true
    error.value = ''
    try {
      const saved = id
        ? await updateManagementNewsArticle(id, payload, token)
        : await createManagementNewsArticle(payload, token)
      news.value = id
        ? news.value.map(item => (item.id === id ? saved : item))
        : [...news.value, saved]
      newsTotal.value = news.value.length
      stampSaved()
      return saved
    } catch {
      error.value = 'Unable to save news article. Check slug uniqueness and required fields.'
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function saveDeliveryCase(payload: DeliveryCasePayload, token: string, id?: number) {
    isSaving.value = true
    error.value = ''
    try {
      const saved = id
        ? await updateManagementDeliveryCase(id, payload, token)
        : await createManagementDeliveryCase(payload, token)
      deliveryCases.value = id
        ? deliveryCases.value.map(item => (item.id === id ? saved : item))
        : [...deliveryCases.value, saved]
      deliveryCaseTotal.value = deliveryCases.value.length
      stampSaved()
      return saved
    } catch {
      error.value = 'Unable to save delivery case. Check slug uniqueness and required fields.'
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function setActive(kind: CatalogKind, id: number, isActive: boolean, token: string) {
    error.value = ''
    try {
      if (kind === 'categories') {
        const saved = await setManagementCategoryActive(id, isActive, token)
        categories.value = categories.value.map(item => (item.id === id ? saved : item))
      }
      if (kind === 'products') {
        const saved = await setManagementProductActive(id, isActive, token)
        products.value = products.value.map(item => (item.id === id ? saved : item))
        activeProductTotal.value += isActive ? 1 : -1
      }
      if (kind === 'solutions') {
        const saved = await setManagementSolutionActive(id, isActive, token)
        solutions.value = solutions.value.map(item => (item.id === id ? saved : item))
      }
      if (kind === 'news') {
        const saved = await setManagementNewsArticleActive(id, isActive, token)
        news.value = news.value.map(item => (item.id === id ? saved : item))
      }
      if (kind === 'delivery-cases') {
        const saved = await setManagementDeliveryCaseActive(id, isActive, token)
        deliveryCases.value = deliveryCases.value.map(item => (item.id === id ? saved : item))
      }
      stampSaved()
    } catch {
      error.value = 'Unable to update active state.'
    }
  }

  async function deleteByKind(kind: CatalogKind, id: number, token: string) {
    if (kind === 'categories') return deleteManagementCategory(id, token)
    if (kind === 'products') return deleteManagementProduct(id, token)
    if (kind === 'solutions') return deleteManagementSolution(id, token)
    if (kind === 'news') return deleteManagementNewsArticle(id, token)
    return deleteManagementDeliveryCase(id, token)
  }

  function removeLocal(kind: CatalogKind, ids: number[]) {
    const idSet = new Set(ids)
    if (kind === 'categories') categories.value = categories.value.filter(item => !idSet.has(item.id))
    else if (kind === 'products') products.value = products.value.filter(item => !idSet.has(item.id))
    else if (kind === 'solutions') solutions.value = solutions.value.filter(item => !idSet.has(item.id))
    else if (kind === 'news') news.value = news.value.filter(item => !idSet.has(item.id))
    else deliveryCases.value = deliveryCases.value.filter(item => !idSet.has(item.id))
    if (kind === 'categories') categoryTotal.value = categories.value.length
    else if (kind === 'solutions') solutionTotal.value = solutions.value.length
    else if (kind === 'news') newsTotal.value = news.value.length
    else if (kind === 'delivery-cases') deliveryCaseTotal.value = deliveryCases.value.length
  }

  function orderedDeleteIds(kind: CatalogKind, ids: number[]) {
    if (kind !== 'categories') return ids
    const selected = new Set(ids)
    const categoryMap = new Map(categories.value.map(category => [category.id, category]))
    function depth(id: number): number {
      let level = 0
      let current = categoryMap.get(id)
      while (current?.parent_id) {
        level += 1
        current = categoryMap.get(current.parent_id)
      }
      return level
    }
    return [...selected].sort((left, right) => depth(right) - depth(left))
  }

  async function remove(kind: CatalogKind, id: number, token: string) {
    isSaving.value = true
    error.value = ''
    try {
      await deleteByKind(kind, id, token)
      removeLocal(kind, [id])
      if (kind === 'products') await refreshProductPageAfterMutation(token)
      stampSaved()
      return true
    } catch {
      if (kind === 'categories') error.value = '无法删除分类。请先删除或迁移该分类下的产品。'
      else if (kind === 'products') error.value = '无法删除产品。'
      else if (kind === 'solutions') error.value = '无法删除解决方案。'
      else if (kind === 'news') error.value = '无法删除资讯。'
      else error.value = '无法删除交付案例。'
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function removeMany(kind: CatalogKind, ids: number[], token: string) {
    if (!ids.length) return []
    isSaving.value = true
    error.value = ''
    const removedIds: number[] = []
    let failedCount = 0
    try {
      for (const id of orderedDeleteIds(kind, ids)) {
        try {
          await deleteByKind(kind, id, token)
          removedIds.push(id)
        } catch {
          failedCount += 1
        }
      }
      if (removedIds.length) {
        removeLocal(kind, removedIds)
        if (kind === 'products') await refreshProductPageAfterMutation(token, removedIds.length)
        stampSaved()
      }
      if (failedCount) {
        if (kind === 'categories') error.value = `已删除 ${removedIds.length} 条分类，${failedCount} 条删除失败。请先删除或迁移其子分类/产品。`
        else error.value = `已删除 ${removedIds.length} 条，${failedCount} 条删除失败。`
      }
      return removedIds
    } finally {
      isSaving.value = false
    }
  }

  async function importBulk(kind: CatalogKind, rows: unknown[], token: string) {
    isSaving.value = true
    error.value = ''
    try {
      if (kind === 'categories') {
        const saved = await bulkCreateManagementCategories(rows as CategoryPayload[], token)
        categories.value = [...categories.value, ...saved]
        categoryTotal.value = categories.value.length
        stampSaved()
        return saved.length
      }
      if (kind === 'products') {
        const saved = await bulkCreateManagementProducts(rows as ProductPayload[], token)
        await loadProductsPage(token, { page: 1, q: '' })
        stampSaved()
        return saved.length
      }
      if (kind === 'solutions') {
        const saved = await bulkCreateManagementSolutions(rows as SolutionPayload[], token)
        solutions.value = [...solutions.value, ...saved]
        solutionTotal.value = solutions.value.length
        stampSaved()
        return saved.length
      }
      if (kind === 'delivery-cases') {
        const saved = await bulkCreateManagementDeliveryCases(rows as DeliveryCasePayload[], token)
        deliveryCases.value = [...deliveryCases.value, ...saved]
        deliveryCaseTotal.value = deliveryCases.value.length
        stampSaved()
        return saved.length
      }
      const saved = await bulkCreateManagementNews(rows as NewsArticlePayload[], token)
      news.value = [...news.value, ...saved]
      newsTotal.value = news.value.length
      stampSaved()
      return saved.length
    } catch {
      error.value = '批量导入失败。请检查 JSON 格式、必填字段、slug 是否重复，以及产品分类 ID 是否存在。'
      return 0
    } finally {
      isSaving.value = false
    }
  }

  return {
    categories,
    products,
    solutions,
    news,
    deliveryCases,
    isLoading,
    isLoadingProducts,
    isSaving,
    error,
    lastSavedAt,
    counts,
    productPage,
    productPageSize,
    productTotal,
    productQuery,
    loadKind,
    loadProductsPage,
    loadProductDetail,
    loadItemDetail,
    saveCategory,
    saveProduct,
    saveSolution,
    saveNewsArticle,
    saveDeliveryCase,
    setActive,
    remove,
    removeMany,
    importBulk,
  }
})
