# React Unit Testing

Guidelines for testing React components and hooks with Vitest and Testing Library.

## Environment Setup

Do NOT manually initialize JSDOM. Vitest is configured with `environment: 'jsdom'` which automatically provides DOM globals.

```typescript
// Avoid: Redundant JSDOM setup
import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!doctype html><html><body></body></html>')

// Correct: Just import what you need
import { renderHook, act } from '@testing-library/react'
```

## Console Mocking

Suppress console noise in tests to keep output clean:

```typescript
import { vi, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})
```

## Testing with waitFor

Do NOT wrap `waitFor` in `act()`. The `waitFor` function from `@testing-library/react` already handles `act()` internally. Double-wrapping causes timing issues.

```typescript
// Avoid: Double-wrapping
await act(async () => {
  await waitFor(() => {
    expect(screen.getByText('Content')).toBeDefined()
  })
})

// Correct: waitFor handles act() internally
await waitFor(() => {
  expect(screen.getByText('Content')).toBeDefined()
})
```

## Reducing Mock Duplication

Create helper factories to reduce boilerplate in tests with complex mocks:

```typescript
const createMockPlatformContext = (
  overrides: {
    activeOrgStream?: Stream.Stream<Either.Either<Org, Error>>
    activeOrg?: Effect.Effect<Org | null>
    userOrgs?: Record<string, string>
  } = {}
) => ({
  authDataService: {} as any,
  orgService: {
    activeOrgStream: overrides.activeOrgStream ?? Stream.empty,
    activeOrg: overrides.activeOrg ?? Effect.succeed(mockOrg),
    setActiveOrgSlug: mockSetActiveOrgSlug,
  } as any,
  userService: {
    user: Effect.succeed({
      org_roles: overrides.userOrgs ?? { 'test-org': 'admin' },
    }),
  } as any,
})

// Usage
it('should show org picker when no org selected', async () => {
  vi.mocked(usePlatformContext).mockReturnValue(
    createMockPlatformContext({
      activeOrgStream: Stream.succeed(Either.left(new NoSelectedOrgError({}))),
      userOrgs: { 'test-org': 'admin', 'another-org': 'member' },
    })
  )
  // ... test body
})
```

## Testing Hooks with Effects

For hooks that use Effect-TS, wrap state transitions in `act()`:

```typescript
import { renderHook, act } from '@testing-library/react'

it('should resolve effect correctly', async () => {
  const { result, unmount } = renderHook(() => useEffectTs(Effect.succeed(42)))

  await act(async () => {
    await new Promise((r) => setTimeout(r, 50))
  })

  await expect(result.current).resolves.toBe(42)
  unmount()
})
```

## Handling Promise Rejections

Catch promise rejections early to prevent unhandled rejection warnings:

```typescript
it('should reject with error', async () => {
  const error = new Error('test error')
  const { result, unmount } = renderHook(() => useEffectTs(Effect.fail(error)))

  // Catch early to prevent unhandled rejection warnings
  const errorPromise = result.current.catch((e) => e)

  await act(async () => {
    await new Promise((r) => setTimeout(r, 50))
  })

  const caught = await errorPromise
  expect(caught).toBe(error)
  unmount()
})
```
