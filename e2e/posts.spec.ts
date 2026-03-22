import { test, expect } from '@playwright/test'

test.describe('Posts CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should create a new post', async ({ page }) => {
    await page.goto('/posts')
    
    await page.click('a:has-text("Create Post")')
    
    await page.waitForURL('/posts/new')
    
    const title = `Test Post ${Date.now()}`
    await page.fill('input[name="title"]', title)
    await page.fill('textarea[name="content"]', 'This is test content for the post')
    
    await page.click('button:has-text("Create Post")')
    
    await page.waitForURL('/posts')
    await expect(page.locator(`text=${title}`)).toBeVisible()
  })

  test('should display list of posts', async ({ page }) => {
    await page.goto('/posts')
    
    await expect(page.locator('h1:has-text("Posts")')).toBeVisible()
    
    const posts = page.locator('[data-testid="post-card"]')
    const count = await posts.count()
    
    if (count > 0) {
      await expect(posts.first()).toBeVisible()
    } else {
      await expect(page.locator('text=No posts yet')).toBeVisible()
    }
  })

  test('should delete a post', async ({ page }) => {
    await page.goto('/posts')
    
    const deleteButtons = page.locator('button:has-text("Delete")')
    const initialCount = await deleteButtons.count()
    
    if (initialCount > 0) {
      await deleteButtons.first().click()
      
      await page.click('button:has-text("Delete"):last-child')
      
      await page.waitForTimeout(1000)
      
      const finalCount = await deleteButtons.count()
      expect(finalCount).toBeLessThan(initialCount)
    }
  })

  test('should handle optimistic updates', async ({ page }) => {
    await page.goto('/posts')
    await page.click('a:has-text("Create Post")')
    
    const title = `Optimistic Post ${Date.now()}`
    await page.fill('input[name="title"]', title)
    await page.fill('textarea[name="content"]', 'Testing optimistic updates')
    
    const submitButton = page.locator('button:has-text("Create Post")')
    await submitButton.click()
    
    await expect(submitButton).toHaveText('Creating...')
    
    await page.waitForURL('/posts')
  })
})