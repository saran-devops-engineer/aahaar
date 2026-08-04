import type {
  IngredientCategory,
  KitchenEquipmentId,
  ResourceVersion,
} from '@/engines/resources/types'

export const RESOURCE_VERSION: ResourceVersion = '2.0.0'

export const RESOURCE_PREF_KEY = 'resourceProfile'

/** Days until expiry → freshness mapping. */
export const FRESHNESS_CONSUME_SOON_DAYS = 3
export const FRESHNESS_GOOD_DAYS = 7

/** Quantity at or below minimum → low stock. */
export const LOW_STOCK_RATIO = 1

export const DEFAULT_CURRENCY = 'INR'

/** Rough unit cost defaults for shopping estimates (deterministic). */
export const DEFAULT_UNIT_COSTS: Readonly<Record<string, number>> = Object.freeze({
  egg: 6,
  eggs: 6,
  paneer: 40,
  tofu: 35,
  curd: 30,
  milk: 55,
  rice: 50,
  dal: 120,
  onion: 30,
  tomato: 40,
  potato: 25,
  spinach: 20,
  oil: 160,
  default: 40,
})

export const CATEGORY_FOR_KEYWORD: readonly {
  pattern: RegExp
  category: IngredientCategory
}[] = Object.freeze([
  { pattern: /rice|wheat|atta|ragi|millet|poha|oats/, category: 'grain' },
  { pattern: /dal|pulse|moong|chana|rajma|beans/, category: 'pulse' },
  { pattern: /onion|tomato|potato|spinach|veg|gourd|carrot|beans/, category: 'vegetable' },
  { pattern: /banana|apple|mango|fruit/, category: 'fruit' },
  { pattern: /milk|curd|paneer|ghee|butter|cheese/, category: 'dairy' },
  { pattern: /egg|chicken|fish|mutton|tofu|soy/, category: 'protein' },
  { pattern: /spice|masala|chili|jeera|turmeric|salt/, category: 'spice' },
  { pattern: /oil|ghee/, category: 'oil' },
] )

export const DEFAULT_EQUIPMENT: readonly KitchenEquipmentId[] = Object.freeze([
  'gas_stove',
  'pressure_cooker',
  'mixer',
])

/** Ingredient substitution chains (deterministic, local). */
export const SUBSTITUTION_CHAINS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  paneer: ['tofu', 'egg', 'soy', 'curd'],
  tofu: ['paneer', 'soy', 'egg', 'curd'],
  egg: ['tofu', 'paneer', 'soy'],
  chicken: ['paneer', 'tofu', 'egg'],
  curd: ['yogurt', 'buttermilk', 'milk'],
  yogurt: ['curd', 'buttermilk'],
  milk: ['curd', 'buttermilk'],
  butter: ['ghee', 'oil'],
  ghee: ['butter', 'oil'],
  rice: ['poha', 'millet', 'ragi'],
})

export const ALL_EQUIPMENT_IDS: readonly KitchenEquipmentId[] = Object.freeze([
  'gas_stove',
  'induction',
  'pressure_cooker',
  'air_fryer',
  'microwave',
  'mixer',
  'oven',
  'rice_cooker',
  'slow_cooker',
])
