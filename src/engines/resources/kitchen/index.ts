import { ALL_EQUIPMENT_IDS, DEFAULT_EQUIPMENT } from '@/engines/resources/constants'
import type {
  CookingFuel,
  KitchenCapabilities,
  KitchenEquipmentId,
} from '@/engines/resources/types'

export function createKitchenCapabilities(
  equipment: readonly KitchenEquipmentId[] = DEFAULT_EQUIPMENT,
  fuels?: readonly CookingFuel[],
): KitchenCapabilities {
  const set = new Set(equipment.map((e) => e.toLowerCase()))
  const has = (id: string) => set.has(id)
  const inferredFuels: CookingFuel[] = []
  if (fuels) inferredFuels.push(...fuels)
  else {
    if (has('gas_stove')) inferredFuels.push('gas')
    if (has('induction')) inferredFuels.push('induction')
    if (has('microwave') || has('oven') || has('air_fryer') || has('rice_cooker')) {
      inferredFuels.push('electric')
    }
    if (inferredFuels.length === 0) inferredFuels.push('unknown')
  }

  return Object.freeze({
    equipment: Object.freeze([...set]),
    fuels: Object.freeze([...new Set(inferredFuels)]),
    hasGas: has('gas_stove') || inferredFuels.includes('gas'),
    hasInduction: has('induction'),
    hasPressureCooker: has('pressure_cooker'),
    hasMicrowave: has('microwave'),
    hasMixer: has('mixer'),
    hasOven: has('oven'),
    hasRiceCooker: has('rice_cooker'),
    hasAirFryer: has('air_fryer'),
    hasSlowCooker: has('slow_cooker'),
  })
}

export function equipmentGaps(
  kitchen: KitchenCapabilities,
  required: readonly KitchenEquipmentId[] = [],
  options?: { needsGas?: boolean; needsPressureCooker?: boolean },
): string[] {
  const gaps: string[] = []
  const owned = new Set(kitchen.equipment.map((e) => e.toLowerCase()))
  for (const req of required) {
    if (!owned.has(req.toLowerCase())) gaps.push(req)
  }
  if (options?.needsGas && !kitchen.hasGas && !kitchen.hasInduction) {
    gaps.push('gas_or_induction')
  }
  if (options?.needsPressureCooker && !kitchen.hasPressureCooker) {
    gaps.push('pressure_cooker')
  }
  return [...new Set(gaps)]
}

export function listKnownEquipment(): readonly KitchenEquipmentId[] {
  return ALL_EQUIPMENT_IDS
}
