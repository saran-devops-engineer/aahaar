import { getFoodsByIds } from '@/engines/knowledge'
import { db } from '@/database/db'
import {
  getMealsForWeek,
  getOrCreateWeekPlan,
} from '@/services/mealPlanService'
import { createId } from '@/shared/utils/id'
import { weekStartIso } from '@/shared/utils/date'
import type { ShoppingItem, ShoppingList } from '@/types/domain'

const CATEGORY_LABELS: Record<string, string> = {
  grain: 'Grains & staples',
  meal: 'Meals & mains',
  bread: 'Breads',
  salad: 'Salads & sides',
  fruit: 'Fruit',
  drink: 'Drinks',
  soup: 'Soups',
  sweet: 'Snacks & sweets',
  fermented: 'Fermented',
  legume: 'Pulses',
}

export async function getShoppingListForWeek(
  userId: string,
  weekStartDate = weekStartIso(),
): Promise<ShoppingList | undefined> {
  const plan = await db.meal_plans.where({ userId, weekStartDate }).first()
  if (!plan) return undefined
  return db.shopping_lists.where({ userId, mealPlanId: plan.id }).first()
}

export async function buildShoppingListFromWeek(
  userId: string,
  weekStartDate = weekStartIso(),
): Promise<ShoppingList> {
  const plan = await getOrCreateWeekPlan(userId, weekStartDate)
  const meals = await getMealsForWeek(userId, weekStartDate)
  if (meals.length === 0) {
    throw new Error('Generate a weekly meal plan before building a shopping list')
  }

  const foods = await getFoodsByIds([...new Set(meals.map((m) => m.foodId))])
  const foodMap = new Map(foods.map((f) => [f.id, f]))

  const aggregates = new Map<
    string,
    { name: string; quantity: number; category: string; foodId: string }
  >()

  for (const meal of meals) {
    const food = foodMap.get(meal.foodId)
    if (!food) continue
    const current = aggregates.get(food.id)
    if (current) {
      current.quantity += meal.servings
    } else {
      aggregates.set(food.id, {
        foodId: food.id,
        name: food.name,
        quantity: meal.servings,
        category: food.category,
      })
    }
  }

  const existing = await db.shopping_lists.where({ userId, mealPlanId: plan.id }).first()
  const checkedByFood = new Map(
    (existing?.items ?? [])
      .filter((item) => item.foodId && item.checked)
      .map((item) => [item.foodId!, true]),
  )

  const items: ShoppingItem[] = [...aggregates.values()]
    .sort((a, b) => {
      const cat = a.category.localeCompare(b.category)
      return cat !== 0 ? cat : a.name.localeCompare(b.name)
    })
    .map((row) => ({
      id: createId('shop'),
      name: row.name,
      quantity: Math.round(row.quantity * 2) / 2,
      unit: row.quantity === 1 ? 'portion' : 'portions',
      checked: checkedByFood.get(row.foodId) ?? false,
      foodId: row.foodId,
      category: CATEGORY_LABELS[row.category] ?? row.category,
    }))

  const now = new Date().toISOString()
  const list: ShoppingList = {
    id: existing?.id ?? createId('list'),
    userId,
    mealPlanId: plan.id,
    items,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await db.shopping_lists.put(list)
  return list
}

export async function toggleShoppingItem(
  listId: string,
  itemId: string,
): Promise<ShoppingList> {
  const list = await db.shopping_lists.get(listId)
  if (!list) throw new Error('Shopping list not found')

  const items = list.items.map((item) =>
    item.id === itemId ? { ...item, checked: !item.checked } : item,
  )
  const updated: ShoppingList = {
    ...list,
    items,
    updatedAt: new Date().toISOString(),
  }
  await db.shopping_lists.put(updated)
  return updated
}

export async function clearCheckedShoppingItems(listId: string): Promise<ShoppingList> {
  const list = await db.shopping_lists.get(listId)
  if (!list) throw new Error('Shopping list not found')

  const updated: ShoppingList = {
    ...list,
    items: list.items.filter((item) => !item.checked),
    updatedAt: new Date().toISOString(),
  }
  await db.shopping_lists.put(updated)
  return updated
}

export function shoppingProgress(list: ShoppingList): {
  total: number
  checked: number
  percent: number
} {
  const total = list.items.length
  const checked = list.items.filter((item) => item.checked).length
  return {
    total,
    checked,
    percent: total === 0 ? 0 : Math.round((checked / total) * 100),
  }
}

export function groupShoppingItems(
  items: ShoppingItem[],
): Array<{ category: string; items: ShoppingItem[] }> {
  const map = new Map<string, ShoppingItem[]>()
  for (const item of items) {
    const key = item.category ?? 'Other'
    const bucket = map.get(key) ?? []
    bucket.push(item)
    map.set(key, bucket)
  }
  return [...map.entries()].map(([category, groupItems]) => ({
    category,
    items: groupItems,
  }))
}
