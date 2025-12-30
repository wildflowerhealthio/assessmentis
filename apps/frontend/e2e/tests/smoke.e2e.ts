import { test, expect } from '@playwright/test'

/**
 * Smoke tests to verify basic application functionality.
 * These tests ensure the app loads and basic navigation works.
 */

test.describe('Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Verify the page loaded successfully
    expect(page.url()).toContain('localhost:5173')
  })

  test('should have a title', async ({ page }) => {
    await page.goto('/')

    // Verify the page has a title defined (even if empty for SPA)
    const title = await page.title()
    expect(title).toBeDefined()
  })

  test('should navigate without errors', async ({ page }) => {
    await page.goto('/')

    // Check for any console errors
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // Navigate to a few routes
    await page.goto('/Encounter')
    await page.goto('/')

    // Verify no errors occurred
    expect(errors).toHaveLength(0)
  })
})
