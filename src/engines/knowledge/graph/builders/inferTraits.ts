import { RICE_BELT_STATES, WHEAT_BELT_STATES } from '@/engines/knowledge/cuisineRegions'
import type { Food } from '@/types/domain'

/** State → primary cuisine labels (deterministic). */
const STATE_CUISINE: Record<string, string[]> = {
  AP: ['Andhra', 'South Indian', 'Telugu'],
  TS: ['Telangana', 'South Indian', 'Telugu'],
  TN: ['Tamil', 'South Indian'],
  KA: ['Karnataka', 'South Indian'],
  KL: ['Kerala', 'South Indian'],
  MH: ['Maharashtrian', 'Western Indian'],
  GJ: ['Gujarati', 'Western Indian'],
  RJ: ['Rajasthani', 'North Indian'],
  PB: ['Punjabi', 'North Indian'],
  HR: ['Haryanvi', 'North Indian'],
  DL: ['North Indian', 'Mughlai'],
  UP: ['Awadhi', 'North Indian'],
  UK: ['North Indian'],
  HP: ['North Indian'],
  MP: ['Central Indian', 'North Indian'],
  CG: ['Central Indian'],
  CT: ['Central Indian'],
  BR: ['Bihari', 'Eastern Indian'],
  JH: ['Eastern Indian'],
  OD: ['Odia', 'Eastern Indian'],
  WB: ['Bengali', 'Eastern Indian'],
  AS: ['Assamese', 'Eastern Indian'],
  GA: ['Goan', 'Coastal Indian'],
}

export function inferCuisines(food: Food): string[] {
  if (food.stateCodes.length === 0) {
    if (isLikelySouthName(food)) return ['South Indian', 'Pan Indian']
    if (isLikelyNorthName(food)) return ['North Indian', 'Pan Indian']
    return ['Pan Indian']
  }

  const set = new Set<string>()
  for (const code of food.stateCodes) {
    for (const cuisine of STATE_CUISINE[code] ?? ['Regional Indian']) {
      set.add(cuisine)
    }
  }
  return [...set]
}

export function inferCookingMethods(food: Food): string[] {
  const text = `${food.id} ${food.name} ${food.category}`.toLowerCase()
  const methods = new Set<string>()
  if (/ferment|idli|dosa|dhokla|handvo|appam|puto|puttu/.test(text)) {
    methods.add('Fermented')
  }
  if (/steam|idli|momos|puttu/.test(text)) methods.add('Steamed')
  if (/fry|bhurji|pakora|bhaji|vepudu/.test(text)) methods.add('Fried')
  if (/grill|tikka|tandoor/.test(text)) methods.add('Grilled')
  if (/soup|stew|pulusu|rasam|charu/.test(text)) methods.add('Simmered')
  if (/salad|chaat|sprout|sundal/.test(text)) methods.add('Fresh')
  if (/curry|sabzi|pappu|dal/.test(text)) methods.add('Curried')
  if (/rice|annam|chawal|pulao|biryani|khichdi|pongal/.test(text)) {
    methods.add('Rice-based')
  }
  if (/roti|paratha|phulka|thepla|bhakri|kulche/.test(text)) {
    methods.add('Wheat-based')
  }
  if (methods.size === 0) methods.add('Home-style')
  return [...methods]
}

export function proteinFamily(food: Food): string {
  const text = `${food.id} ${food.name}`.toLowerCase()
  if (/chicken|murg/.test(text)) return 'poultry'
  if (/fish|hilsa|machher|chepala|molee/.test(text)) return 'fish'
  if (/egg|omelette/.test(text)) return 'egg'
  if (/paneer/.test(text)) return 'paneer'
  if (/tofu|soy/.test(text)) return 'soy'
  if (
    /dal|pappu|sambar|rajma|chole|sundal|moong|besan|misal|sprout|kadala|chana/.test(
      text,
    )
  ) {
    return 'legume'
  }
  if (/curd|dahi|perugu|buttermilk|raita|chaas/.test(text)) return 'dairy'
  if (food.nutrition.proteinG >= 14) return 'high-protein'
  return 'mixed'
}

function isLikelySouthName(food: Food): boolean {
  return /idli|dosa|sambar|rasam|pongal|pulihora|pesarattu|appam|puttu|avial|sadya/.test(
    food.name.toLowerCase(),
  )
}

function isLikelyNorthName(food: Food): boolean {
  return /roti|paratha|paneer|chole|rajma|kulche|sarson/.test(food.name.toLowerCase())
}

export function stapleBelt(food: Food): 'rice' | 'wheat' | 'mixed' {
  const states = food.stateCodes
  if (states.length === 0) {
    const methods = inferCookingMethods(food)
    if (methods.includes('Rice-based')) return 'rice'
    if (methods.includes('Wheat-based')) return 'wheat'
    return 'mixed'
  }
  const rice = states.filter((s) => RICE_BELT_STATES.has(s)).length
  const wheat = states.filter((s) =>
    (WHEAT_BELT_STATES as readonly string[]).includes(s),
  ).length
  if (rice > 0 && wheat === 0) return 'rice'
  if (wheat > 0 && rice === 0) return 'wheat'
  return 'mixed'
}
