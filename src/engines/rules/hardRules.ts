import {
  GI_DIABETES_LIMIT_THRESHOLD,
  GI_LIMIT_THRESHOLD,
} from '@/config/constants'
import type { HardRule } from '@/engines/rules/types'
import type { Food } from '@/types/domain'

function suitability(
  food: Food,
  condition: HardRule['conditionId'],
): 'suitable' | 'limit' | 'avoid' | undefined {
  return food.medicalSuitability[condition]
}

export const HARD_RULES: HardRule[] = [
  {
    id: 'rule-diabetes-gi',
    conditionId: 'diabetes',
    priority: 100,
    description: 'Block high-GI foods for diabetes when marked avoid',
    evaluate: (food) => {
      const s = suitability(food, 'diabetes')
      const gi = food.nutrition.glycemicIndex ?? 0
      if (s === 'avoid') return 'block'
      if (s === 'limit' || gi >= GI_LIMIT_THRESHOLD) return 'limit'
      if (gi >= GI_DIABETES_LIMIT_THRESHOLD && s !== 'suitable') return 'limit'
      return 'allow'
    },
    reason: (food, verdict) =>
      verdict === 'block'
        ? `${food.name} is marked avoid for diabetes`
        : `${food.name} should be limited for diabetes (GI/suitability)`,
  },
  {
    id: 'rule-ckd-protein',
    conditionId: 'ckd',
    priority: 110,
    description: 'Limit high-protein foods for CKD',
    evaluate: (food) => {
      const s = suitability(food, 'ckd')
      if (s === 'avoid') return 'block'
      if (s === 'limit' || food.nutrition.proteinG >= 20) return 'limit'
      return 'allow'
    },
    reason: (food, verdict) =>
      verdict === 'block'
        ? `${food.name} is marked avoid for CKD`
        : `${food.name} is high protein — limit for CKD`,
  },
  {
    id: 'rule-hypertension-sodium',
    conditionId: 'hypertension',
    priority: 100,
    description: 'Block high-sodium foods for hypertension',
    evaluate: (food) => {
      const s = suitability(food, 'hypertension')
      const sodium = food.nutrition.sodiumMg ?? 0
      if (s === 'avoid' || sodium >= 800) return 'block'
      if (s === 'limit' || sodium >= 400) return 'limit'
      return 'allow'
    },
    reason: (food, verdict) =>
      verdict === 'block'
        ? `${food.name} is too high in sodium for hypertension`
        : `${food.name} should be limited for hypertension`,
  },
  {
    id: 'rule-pregnancy',
    conditionId: 'pregnancy',
    priority: 120,
    description: 'Block foods marked avoid in pregnancy',
    evaluate: (food) => {
      const s = suitability(food, 'pregnancy')
      if (s === 'avoid') return 'block'
      if (s === 'limit') return 'limit'
      return 'allow'
    },
    reason: (food, verdict) =>
      `${food.name} is ${verdict === 'block' ? 'not recommended' : 'limited'} in pregnancy`,
  },
  {
    id: 'rule-thyroid',
    conditionId: 'thyroid',
    priority: 90,
    description: 'Apply thyroid medical suitability',
    evaluate: (food) => {
      const s = suitability(food, 'thyroid')
      if (s === 'avoid') return 'block'
      if (s === 'limit') return 'limit'
      return 'allow'
    },
    reason: (food, verdict) =>
      `${food.name} is ${verdict === 'block' ? 'avoided' : 'limited'} for thyroid`,
  },
  {
    id: 'rule-pcos',
    conditionId: 'pcos',
    priority: 90,
    description: 'Limit high-GI foods for PCOS',
    evaluate: (food) => {
      const s = suitability(food, 'pcos')
      const gi = food.nutrition.glycemicIndex ?? 0
      if (s === 'avoid') return 'block'
      if (s === 'limit' || gi >= GI_LIMIT_THRESHOLD) return 'limit'
      return 'allow'
    },
    reason: (food, verdict) =>
      `${food.name} is ${verdict === 'block' ? 'avoided' : 'limited'} for PCOS`,
  },
  {
    id: 'rule-children',
    conditionId: 'children',
    priority: 80,
    description: 'Children suitability gate',
    evaluate: (food) => {
      const s = suitability(food, 'children')
      if (s === 'avoid') return 'block'
      if (s === 'limit') return 'limit'
      return 'allow'
    },
    reason: (food, verdict) =>
      `${food.name} is ${verdict === 'block' ? 'not suitable' : 'limited'} for children`,
  },
  {
    id: 'rule-elderly',
    conditionId: 'elderly',
    priority: 80,
    description: 'Elderly suitability gate',
    evaluate: (food) => {
      const s = suitability(food, 'elderly')
      if (s === 'avoid') return 'block'
      if (s === 'limit') return 'limit'
      return 'allow'
    },
    reason: (food, verdict) =>
      `${food.name} is ${verdict === 'block' ? 'not suitable' : 'limited'} for elderly`,
  },
]
