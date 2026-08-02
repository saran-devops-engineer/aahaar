import Dexie, { type EntityTable } from 'dexie'
import { DB_NAME, DB_VERSION } from '@/config/constants'
import { TABLE_INDEXES, type AahaarTables } from '@/database/schema'

export class AahaarDatabase extends Dexie {
  users!: EntityTable<AahaarTables['users'], 'id'>
  profiles!: EntityTable<AahaarTables['profiles'], 'id'>
  conditions!: EntityTable<AahaarTables['conditions'], 'id'>
  foods!: EntityTable<AahaarTables['foods'], 'id'>
  nutrients!: EntityTable<AahaarTables['nutrients'], 'id'>
  regions!: EntityTable<AahaarTables['regions'], 'id'>
  districts!: EntityTable<AahaarTables['districts'], 'id'>
  seasons!: EntityTable<AahaarTables['seasons'], 'id'>
  meal_plans!: EntityTable<AahaarTables['meal_plans'], 'id'>
  meals!: EntityTable<AahaarTables['meals'], 'id'>
  shopping_lists!: EntityTable<AahaarTables['shopping_lists'], 'id'>
  feedback!: EntityTable<AahaarTables['feedback'], 'id'>
  preferences!: EntityTable<AahaarTables['preferences'], 'id'>
  rules!: EntityTable<AahaarTables['rules'], 'id'>
  water_logs!: EntityTable<AahaarTables['water_logs'], 'id'>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      users: 'id, onboardingComplete',
      profiles: 'id, userId, stateCode, districtId',
      conditions: 'id, userId, conditionId',
      foods: 'id, category, costTier, *stateCodes, *seasons, *mealTypes',
      nutrients: 'id, foodId, key',
      regions: 'id, stateCode',
      districts: 'id, stateCode',
      seasons: 'id, name',
      meal_plans: 'id, userId, weekStartDate',
      meals: 'id, mealPlanId, date, mealType, foodId',
      shopping_lists: 'id, userId, mealPlanId',
      feedback: 'id, userId, mealId, foodId',
      preferences: 'id, userId, key',
      rules: 'id, conditionId, priority',
      water_logs: 'id, userId, date',
    })
    this.version(2).stores({
      users: 'id, createdAt, onboardingComplete',
      profiles: 'id, userId, stateCode, districtId',
      conditions: 'id, userId, conditionId',
      foods: 'id, category, costTier, *stateCodes, *seasons, *mealTypes',
      nutrients: 'id, foodId, key',
      regions: 'id, stateCode',
      districts: 'id, stateCode',
      seasons: 'id, name',
      meal_plans: 'id, userId, weekStartDate',
      meals: 'id, mealPlanId, date, mealType, foodId',
      shopping_lists: 'id, userId, mealPlanId',
      feedback: 'id, userId, mealId, foodId',
      preferences: 'id, [userId+key], userId, key',
      rules: 'id, conditionId, priority',
      water_logs: 'id, [userId+date], userId, date',
    })
    this.version(DB_VERSION).stores(TABLE_INDEXES)
  }
}

export const db = new AahaarDatabase()
