import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/register')
    
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`)
    await page.fill('input[name="password"]', 'TestPassword123!')
    
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Welcome')).toBeVisible()
  })

  test('should login with existing user', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should logout successfully', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/dashboard')
    
    await page.click('button:has-text("Sign out")')
    
    await page.waitForURL('/')
    await expect(page).toHaveURL('/')
  })

  test('should handle invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })
})