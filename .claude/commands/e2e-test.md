# e2e-test

Generate end-to-end test for a user workflow using Playwright.

**Workflow description:** $ARGUMENTS

## Steps

1. Understand the user workflow from the description
2. Identify pages, actions, and expected outcomes
3. Create Playwright test file in `apps/frontend/e2e/tests/`
4. Determine if authentication is required for the workflow
5. Write test with:
   - Proper imports (`@playwright/test` or custom fixtures)
   - Page navigation using `page.goto()`
   - User interactions (click, fill, select)
   - Assertions for expected state using `expect()`
   - Visual verification with screenshots where appropriate
6. Add `data-testid` attributes to components if selectors are unreliable
7. Run test to verify: `npm run test:e2e -- path/to/test.spec.ts`
8. Fix any failing assertions
9. Commit test file with descriptive message

## Example Test Structure

```typescript
import { test, expect } from '@playwright/test'

test.describe('$ARGUMENTS', () => {
  test('should complete workflow successfully', async ({ page }) => {
    // 1. Navigate to starting page
    await page.goto('/starting-route')

    // 2. Perform user actions
    await page.click('button:has-text("Action")')
    await page.fill('[name="field"]', 'value')

    // 3. Assert expected outcomes
    await expect(page.locator('h1')).toContainText('Expected Result')

    // 4. Verify final state
    await expect(page).toHaveURL(/\/success-route/)
  })

  test('should handle errors gracefully', async ({ page }) => {
    // Test error scenarios and edge cases
    await page.goto('/starting-route')
    await page.click('button:has-text("Submit")')

    // Verify error message appears
    await expect(page.locator('.error-message')).toBeVisible()
  })
})
```

## Best Practices

- **Stable selectors:** Use `data-testid` attributes for critical elements
- **Wait for completion:** Use `await expect()` instead of manual waits
- **Network requests:** Wait for important API calls to complete
- **Screenshots:** Take screenshots at critical verification points
- **Test both paths:** Happy path AND error scenarios
- **Page Object Pattern:** For complex workflows, create page objects in `e2e/utils/`

## Example with Authentication

If the workflow requires login:

```typescript
import { test, expect } from '@playwright/test'

test.describe('$ARGUMENTS (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/Encounter')
  })

  test('should complete workflow', async ({ page }) => {
    // Test implementation
  })
})
```

## Running the Test

```bash
cd apps/frontend

# Run specific test
npm run test:e2e -- e2e/tests/path/to/test.spec.ts

# Run in UI mode for debugging
npm run test:e2e:ui

# Run with inspector
npm run test:e2e:debug
```
