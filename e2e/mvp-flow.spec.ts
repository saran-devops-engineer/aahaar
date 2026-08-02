import { expect, test, type Page } from '@playwright/test'

async function resetApp(page: Page) {
  await page.goto('/')
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('aahaar')
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
      request.onblocked = () => resolve()
    })
  })
  await page.reload()
  await expect(page.getByTestId('onboarding-panel')).toBeVisible({ timeout: 15_000 })
}

async function completeOnboarding(page: Page) {
  await page.getByTestId('onboarding-continue').click()
  await page.getByTestId('onboarding-continue').click()
  await page.getByTestId('onboarding-finish').click()
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible({
    timeout: 15_000,
  })
}

test.describe('AAHAAR MVP flows', () => {
  test('onboarding → weekly plan → shopping list', async ({ page }) => {
    await resetApp(page)
    await completeOnboarding(page)

    const primaryNav = page.getByRole('navigation', { name: 'Primary' })
    await primaryNav.getByRole('link', { name: 'Plan' }).click()
    await expect(page.getByRole('heading', { name: 'Weekly planner' })).toBeVisible()

    await page.getByTestId('generate-week').click()
    await expect(page.getByTestId('day-meals')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('day-meals').locator('li')).toHaveCount(4, {
      timeout: 30_000,
    })

    await primaryNav.getByRole('link', { name: 'Shop' }).click()
    await expect(page.getByRole('heading', { name: 'Shopping' })).toBeVisible()
    await page.getByTestId('build-shopping-list').click()
    await expect(page.getByTestId('shopping-groups')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByTestId('shopping-groups').locator('button').first()).toBeVisible()
  })

  test('home plan today works after onboarding', async ({ page }) => {
    await resetApp(page)
    await completeOnboarding(page)

    await page.getByTestId('plan-today').click()
    await expect(page.getByText(/kcal/i).first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /Why\?/i }).first()).toBeVisible()
  })
})
