import type { RuleRecord } from '@/types/domain'

/** Serializable hard-rule metadata for storage / auditing. */
export const RULE_RECORDS: RuleRecord[] = [
  {
    id: 'rule-diabetes-gi',
    conditionId: 'diabetes',
    priority: 100,
    description: 'Limit or block high-GI foods for diabetes',
    payload: JSON.stringify({ maxGiAllow: 69, maxGiLimit: 55 }),
  },
  {
    id: 'rule-ckd-protein',
    conditionId: 'ckd',
    priority: 110,
    description: 'Limit high-protein foods for CKD',
    payload: JSON.stringify({ proteinLimitG: 20 }),
  },
  {
    id: 'rule-hypertension-sodium',
    conditionId: 'hypertension',
    priority: 100,
    description: 'Block high-sodium foods for hypertension',
    payload: JSON.stringify({ sodiumBlockMg: 800, sodiumLimitMg: 400 }),
  },
  {
    id: 'rule-pregnancy-allergens',
    conditionId: 'pregnancy',
    priority: 120,
    description: 'Apply pregnancy suitability tags',
    payload: JSON.stringify({}),
  },
  {
    id: 'rule-thyroid',
    conditionId: 'thyroid',
    priority: 90,
    description: 'Apply thyroid suitability tags',
    payload: JSON.stringify({}),
  },
  {
    id: 'rule-pcos',
    conditionId: 'pcos',
    priority: 90,
    description: 'Limit high-GI foods for PCOS',
    payload: JSON.stringify({ maxGiLimit: 70 }),
  },
  {
    id: 'rule-children',
    conditionId: 'children',
    priority: 80,
    description: 'Children suitability gate',
    payload: JSON.stringify({}),
  },
  {
    id: 'rule-elderly',
    conditionId: 'elderly',
    priority: 80,
    description: 'Elderly suitability gate',
    payload: JSON.stringify({}),
  },
]
