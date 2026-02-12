# E2E Testing Reference

This reference describes the Playwright end-to-end testing layout for the frontend app.

## Structure

- tests/ holds Playwright spec files and test groupings.
- fixtures/ holds reusable data or setup helpers.
- utils/ holds shared helpers for navigation, auth, and assertions.

## Conventions

- Use test.describe to group flows by feature.
- Prefer explicit navigation and waitForLoadState for SPA stability.
- Keep tests deterministic and avoid relying on external network state.
- Use the .e2e.ts suffix for Playwright specs.
- Base URL and browser config live in Playwright config.

## Most-used code locations

- Playwright config: [apps/frontend/playwright.config.ts](apps/frontend/playwright.config.ts)
- Test suites: [apps/frontend/e2e/tests](apps/frontend/e2e/tests)
- Smoke tests: [apps/frontend/e2e/tests/smoke.e2e.ts](apps/frontend/e2e/tests/smoke.e2e.ts)
- Fixtures: [apps/frontend/e2e/fixtures](apps/frontend/e2e/fixtures)
- Utils: [apps/frontend/e2e/utils](apps/frontend/e2e/utils)
