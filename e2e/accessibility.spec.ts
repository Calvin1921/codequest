import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

test.describe("Accessibility Tests", () => {
  test("should not have any automatically detectable accessibility issues on homepage", async ({
    page,
  }) => {
    await page.goto("/")

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test("should not have accessibility issues on login page", async ({ page }) => {
    await page.goto("/login")

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test("should not have accessibility issues on register page", async ({ page }) => {
    await page.goto("/register")

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test("should have proper keyboard navigation", async ({ page }) => {
    await page.goto("/login")

    await page.keyboard.press("Tab")
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName)
    expect(firstFocused).toBeTruthy()

    await page.keyboard.press("Tab")
    const secondFocused = await page.evaluate(() => document.activeElement?.tagName)
    expect(secondFocused).toBeTruthy()

    await page.keyboard.press("Shift+Tab")
    const backFocused = await page.evaluate(() => document.activeElement?.tagName)
    expect(backFocused).toBe(firstFocused)
  })

  test("should have proper ARIA labels", async ({ page }) => {
    await page.goto("/login")

    const emailInput = page.locator('input[name="email"]')
    await expect(emailInput).toHaveAttribute("id")

    const emailLabel = page.locator('label[for="email"]')
    await expect(emailLabel).toBeVisible()

    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toHaveText(/sign in/i)
  })

  // NOTE: a prior "focus management in modals" test drove this via the Posts
  // feature's Create Post modal. The Posts feature (routes, modal, server
  // action) was removed in the "Remove dead code: Posts feature..." commit,
  // which left this /posts navigation pointing at a deleted route and
  // clicking a button that no longer exists — the commit message claimed the
  // Posts e2e coverage was removed too, but this spec was missed. Removed
  // rather than reworked to keep this a minimal, root-cause fix; modal focus
  // management doesn't currently have another test surface in this suite.
})
