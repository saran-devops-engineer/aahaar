import { CATEGORY_FOR_KEYWORD } from '@/engines/resources/constants'
import type { IngredientCategory } from '@/engines/resources/types'

export function normalizeIngredientKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function inferCategory(ingredient: string): IngredientCategory {
  const text = ingredient.toLowerCase()
  for (const row of CATEGORY_FOR_KEYWORD) {
    if (row.pattern.test(text)) return row.category
  }
  return 'other'
}
