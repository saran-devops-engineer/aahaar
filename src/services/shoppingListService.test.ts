import { describe, expect, it } from 'vitest'
import {
  groupShoppingItems,
  shoppingProgress,
} from '@/services/shoppingListService'
import type { ShoppingItem, ShoppingList } from '@/types/domain'

describe('shopping list helpers', () => {
  const items: ShoppingItem[] = [
    {
      id: '1',
      name: 'Poha',
      quantity: 2,
      unit: 'portions',
      checked: true,
      category: 'Grains & staples',
    },
    {
      id: '2',
      name: 'Dal Rice',
      quantity: 3,
      unit: 'portions',
      checked: false,
      category: 'Meals & mains',
    },
    {
      id: '3',
      name: 'Roti Sabzi',
      quantity: 1,
      unit: 'portion',
      checked: false,
      category: 'Meals & mains',
    },
  ]

  it('computes progress', () => {
    const list: ShoppingList = {
      id: 'l1',
      userId: 'u1',
      mealPlanId: 'p1',
      items,
      createdAt: '',
      updatedAt: '',
    }
    expect(shoppingProgress(list)).toEqual({ total: 3, checked: 1, percent: 33 })
  })

  it('groups by category', () => {
    const groups = groupShoppingItems(items)
    expect(groups).toHaveLength(2)
    expect(groups.find((g) => g.category === 'Meals & mains')?.items).toHaveLength(2)
  })
})
