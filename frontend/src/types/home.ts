import type { CategoryTree } from '../api/catalog'

export type CategoryVisualKey =
  | 'transformer'
  | 'transformer-accessory'
  | 'switchgear'
  | 'switchgear-cabinet'
  | 'solar'
  | 'reactor'
  | 'cable'
  | 'compensation'
  | 'drive'
  | 'tools'

export interface CategoryTile {
  slug: string
  name: string
  parentId: number | null
  icon: string
  sku: string
  tags: string[]
  visualKey: CategoryVisualKey
  visualTone: string
  children: CategoryTile[]
  isMore?: boolean
}

export type HomeCategory = Pick<CategoryTile, 'slug' | 'name' | 'icon' | 'sku' | 'tags' | 'children' | 'isMore'>

export type HomeCategoryTree = CategoryTree
