import type { ResourceAnalytics, ResourceProfile } from '@/engines/resources/types'

export function computeResourceAnalytics(profile: ResourceProfile): ResourceAnalytics {
  const expiringCount = profile.inventory.filter(
    (i) => i.freshness === 'consume_soon' || i.freshness === 'expiring_today',
  ).length
  const expiredCount = profile.inventory.filter((i) => i.freshness === 'expired').length
  const lowStockCount = profile.inventory.filter(
    (i) => i.quantity <= i.minimumLevel,
  ).length

  const wasteRiskScore = Math.min(
    100,
    expiredCount * 25 + expiringCount * 12 + Math.max(0, profile.leftovers.length - 1) * 8,
  )

  return Object.freeze({
    inventoryCount: profile.inventory.length,
    expiringCount,
    expiredCount,
    lowStockCount,
    leftoverCount: profile.leftovers.length,
    budgetRemaining: profile.budget.remaining,
    wasteRiskScore,
  })
}
