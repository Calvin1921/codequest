import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues on homepage', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should not have accessibility issues on login page', async ({ page }) => {
    await page.goto('/login')
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should not have accessibility issues on register page', async ({ page }) => {
    await page.goto('/register')
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper keyboard navigation', async ({ page }) => {
    await page.goto('/login')
    
    await page.keyboard.press('Tab')
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName)
    expect(firstFocused).toBeTruthy()
    
    await page.keyboard.press('Tab')
    const secondFocused = await page.evaluate(() => document.activeElement?.tagName)
    expect(secondFocused).toBeTruthy()
    
    await page.keyboard.press('Shift+Tab')
    const backFocused = await page.evaluate(() => document.activeElement?.tagName)
    expect(backFocused).toBe(firstFocused)
  })

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/login')
    
    const emailInput = page.locator('input[name="email"]')
    await expect(emailInput).toHaveAttribute('id')
    
    const emailLabel = page.locator('label[for="email"]')
    await expect(emailLabel).toBeVisible()
    
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toHaveText(/sign in/i)
  })

  test('should handle focus management in modals', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    
    await page.goto('/posts')
    await page.click('a:has-text("Create Post")')
    
    const dialogTitle = page.locator('[role="dialog"] h2')
    await expect(dialogTitle).toBeVisible()
    
    await page.keyboard.press('Escape')
    
    await expect(dialogTitle).not.toBeVisible()
  })
})