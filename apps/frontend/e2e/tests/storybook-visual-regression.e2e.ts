import { expect, test } from '@playwright/test'

/**
 * Visual regression tests for Storybook stories
 * Tests picker components in isolation using Storybook
 */

const STORYBOOK_URL = 'http://localhost:6006'

test.describe('Storybook Visual Regression - Form Fields', () => {
  test('DateField - Default', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=components-form-fields-datefield--default&viewMode=story`
    )
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('datefield-default.png', {
      maxDiffPixels: 100,
    })
  })

  test('DateField - With Value', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=components-form-fields-datefield--with-value&viewMode=story`
    )
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('datefield-with-value.png', {
      maxDiffPixels: 100,
    })
  })

  test('DateField - With Error', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=components-form-fields-datefield--with-error&viewMode=story`
    )
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('datefield-with-error.png', {
      maxDiffPixels: 100,
    })
  })

  test('SelectField - Default', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=components-form-fields-selectfield--default&viewMode=story`
    )
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('selectfield-default.png', {
      maxDiffPixels: 100,
    })
  })

  test('SelectField - With Selection', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=components-form-fields-selectfield--with-selection&viewMode=story`
    )
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('selectfield-with-selection.png', {
      maxDiffPixels: 100,
    })
  })

  test('SelectField - With Error', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=components-form-fields-selectfield--with-error&viewMode=story`
    )
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('selectfield-with-error.png', {
      maxDiffPixels: 100,
    })
  })
})
