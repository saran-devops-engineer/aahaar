import { PLATE_COMPOSITIONS } from '@/engines/knowledge/data/plateCompositions'
import type { Food } from '@/types/domain'

/**
 * Infer ingredient labels from curated plate parts + name heuristics.
 * Does not invent lab nutrition — labels only for graph edges.
 */
export function inferIngredients(food: Food): string[] {
  const set = new Set<string>()
  const parts = PLATE_COMPOSITIONS[food.id] ?? []
  for (const part of parts) {
    const cleaned = simplifyIngredient(part.name)
    if (cleaned) set.add(cleaned)
  }

  const text = food.name.toLowerCase()
  const hints: Array<[RegExp, string]> = [
    [/rice|annam|chawal|poha|pongal|khichdi|pulao|biryani/, 'Rice'],
    [/roti|paratha|phulka|thepla|bhakri|kulche|mudde|ragi/, 'Millet or Wheat'],
    [/dal|pappu|sambar|moong|rajma|chole|kadala|sundal/, 'Pulses'],
    [/paneer/, 'Paneer'],
    [/curd|dahi|perugu|yogurt|raita/, 'Curd'],
    [/egg/, 'Egg'],
    [/chicken/, 'Chicken'],
    [/fish|hilsa|machher|chepala/, 'Fish'],
    [/coconut/, 'Coconut'],
    [/spinach|palak|soppu|greens|gongura/, 'Leafy greens'],
    [/vegetable|sabzi|koora|sambar|salad|avial/, 'Vegetables'],
  ]
  for (const [pattern, label] of hints) {
    if (pattern.test(text)) set.add(label)
  }

  if (set.size === 0) set.add(food.category || 'Staple')
  return [...set]
}

function simplifyIngredient(name: string): string {
  return name
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+with\s+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48)
}
