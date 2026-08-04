import { SUBSTITUTION_CHAINS } from '@/engines/resources/constants'
import { isUsable, stockAvailabilityForItem } from '@/engines/resources/availability'
import { buildResourceIndex } from '@/engines/resources/inventory'
import { normalizeIngredientKey } from '@/engines/resources/inventory/normalize'
import type { ResourceProfile } from '@/engines/resources/types'

/**
 * Deterministic substitution chain.
 * Example: Paneer → Tofu → Egg → Soy → Curd
 */
export function substitutionChain(ingredient: string): readonly string[] {
  const key = normalizeIngredientKey(ingredient)
  for (const [base, chain] of Object.entries(SUBSTITUTION_CHAINS)) {
    if (key === base || key.includes(base)) {
      return Object.freeze([ingredient, ...chain])
    }
  }
  return Object.freeze([ingredient])
}

export function findSubstitutes(
  ingredient: string,
  profile: ResourceProfile,
): readonly string[] {
  const index = buildResourceIndex(profile.inventory)
  const chain = substitutionChain(ingredient)
  const available: string[] = []
  for (const candidate of chain.slice(1)) {
    const item = index.byIngredient.get(normalizeIngredientKey(candidate))
    const status = stockAvailabilityForItem(item, profile.market, candidate)
    if (isUsable(status)) available.push(candidate)
  }
  return Object.freeze(available)
}

export function resolveIngredientWithSubstitution(
  ingredient: string,
  profile: ResourceProfile,
): { readonly ingredient: string; readonly substituted: boolean; readonly from?: string } {
  const index = buildResourceIndex(profile.inventory)
  const direct = index.byIngredient.get(normalizeIngredientKey(ingredient))
  const directStatus = stockAvailabilityForItem(direct, profile.market, ingredient)
  if (isUsable(directStatus)) {
    return Object.freeze({ ingredient, substituted: false })
  }
  const subs = findSubstitutes(ingredient, profile)
  if (subs[0]) {
    return Object.freeze({ ingredient: subs[0], substituted: true, from: ingredient })
  }
  return Object.freeze({ ingredient, substituted: false })
}
