import { PLATE_COMPOSITIONS } from '@/engines/knowledge/data/plateCompositions'
import type { Food, MealType, PlatePart, PlateRole } from '@/types/domain'

const ROLE_LABELS: Record<PlateRole, string> = {
  carb: 'carbs for energy',
  protein: 'protein for satiety and repair',
  vegetable: 'vegetables for fibre and micronutrients',
  dairy: 'dairy for calcium and probiotics',
  fat: 'fats for absorption and fullness',
  fruit: 'fruit for vitamins and natural sugars',
}

const CORE_ROLES: PlateRole[] = ['carb', 'protein', 'vegetable']

const MISSING_SUGGESTIONS: Record<PlateRole, string> = {
  carb: 'Add rice, roti, millets, or another grain staple for steady energy.',
  protein:
    'Add dal, curd, sprouts, eggs, paneer, fish, or legumes — a carb-only plate (like idli alone) is not a complete meal.',
  vegetable: 'Add sabzi, salad, sambar vegetables, or greens for fibre and micronutrients.',
  dairy: 'A small serving of curd or buttermilk pairs well if you eat dairy.',
  fat: 'A light drizzle of oil/ghee or a few nuts helps nutrient absorption.',
  fruit: 'A piece of seasonal fruit helps if this is a snack or light meal.',
}

export interface PlateBalanceResult {
  parts: PlatePart[]
  presentRoles: PlateRole[]
  missingCoreRoles: PlateRole[]
  isBalanced: boolean
  partSummaries: string[]
  gapRecommendations: string[]
  balanceVerdict: string
}

/**
 * Explains what a meal should consist of and what is still missing for balance.
 * Uses curated plate parts; never invents nutrition numbers.
 */
export function analyzePlateBalance(
  food: Food,
  mealType: MealType,
): PlateBalanceResult {
  const parts = resolvePlateParts(food)
  const coreParts = parts.filter((part) => !part.optional)
  const optionalParts = parts.filter((part) => part.optional)
  const presentRoles = uniqueRoles(coreParts)
  const required = requiredCoreRoles(mealType)
  const missingCoreRoles = required.filter((role) => !presentRoles.includes(role))
  const isBalanced = missingCoreRoles.length === 0

  const partSummaries = coreParts.map((part) => {
    const roleText = part.roles.map((role) => ROLE_LABELS[role]).join(', ')
    return `${part.name} contributes ${roleText}`
  })

  const gapRecommendations: string[] = []
  for (const role of missingCoreRoles) {
    const matchingOptional = optionalParts.find((part) => part.roles.includes(role))
    if (matchingOptional) {
      gapRecommendations.push(
        `Include ${matchingOptional.name} — it adds ${matchingOptional.roles.map(humanRole).join(' and ')}.`,
      )
    } else {
      gapRecommendations.push(MISSING_SUGGESTIONS[role])
    }
  }

  // Deduplicate while preserving order
  const uniqueGaps = [...new Set(gapRecommendations)]

  const balanceVerdict = isBalanced
    ? `${food.name} covers carbs, protein, and vegetables together — that is what makes it a balanced plate. Any single part alone would not be enough.`
    : missingCoreRoles.length === required.length
      ? `${food.name} is incomplete on its own for ${mealType}. Build it out with the missing pieces below.`
      : `${food.name} is a good start, but without ${missingCoreRoles.map(humanRole).join(' and ')} it is not a fully balanced ${mealType}.`

  return {
    parts,
    presentRoles,
    missingCoreRoles,
    isBalanced,
    partSummaries,
    gapRecommendations: uniqueGaps,
    balanceVerdict,
  }
}

export function resolvePlateParts(food: Food): PlatePart[] {
  const curated = PLATE_COMPOSITIONS[food.id]
  if (curated && curated.length > 0) return curated
  return derivePartsFromMacros(food)
}

function requiredCoreRoles(mealType: MealType): PlateRole[] {
  if (mealType === 'snack') return []
  return CORE_ROLES
}

function derivePartsFromMacros(food: Food): PlatePart[] {
  const n = food.nutrition
  const roles: PlateRole[] = []

  if (n.carbsG >= 15) roles.push('carb')
  if (n.proteinG >= 8) roles.push('protein')
  if (n.fiberG >= 3 || food.category === 'salad' || food.category === 'soup') {
    roles.push('vegetable')
  }
  if (n.fatG >= 8) roles.push('fat')
  if (food.category === 'fruit') roles.push('fruit')
  if (food.category === 'drink') roles.push('dairy')

  if (roles.length === 0) roles.push('carb')

  return [{ name: food.name, roles }]
}

function uniqueRoles(parts: PlatePart[]): PlateRole[] {
  const set = new Set<PlateRole>()
  for (const part of parts) {
    for (const role of part.roles) set.add(role)
  }
  return [...set]
}

function humanRole(role: PlateRole): string {
  switch (role) {
    case 'carb':
      return 'carbs'
    case 'protein':
      return 'protein'
    case 'vegetable':
      return 'vegetables'
    case 'dairy':
      return 'dairy'
    case 'fat':
      return 'fats'
    case 'fruit':
      return 'fruit'
  }
}
