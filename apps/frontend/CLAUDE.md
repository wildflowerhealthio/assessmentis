# apps/frontend/ - React Router v7 SPA

This directory contains the main user interface for Assessment.is. See [../../CLAUDE.md](../../CLAUDE.md) for general project guidance.

## Technology Stack

- **React 19.2.0** - UI library
- **React Router v7** - SPA routing (no SSR)
- **Vite 7.2+** - Build tool and dev server
- **Tundra CSS 0.13.0** - Utility-first CSS framework
- **CSS Modules** - Component-specific styles
- **Effect-TS** - Dependency injection and effects
- **OpenTelemetry** - Tracing and observability

## Quick Commands

```bash
npm run dev              # Start dev server with HMR (http://localhost:5173)
npm run build            # Build production SPA
npm run typegen          # Generate React Router types
npm run typecheck        # Type check without building
npm run lint:fix         # Auto-fix linting issues
firebase deploy --only hosting  # Deploy to Firebase Hosting
```

## File Structure

```
app/
├── root.tsx                    # Root layout and error boundary
├── routes/                     # File-based routing
│   ├── _index.tsx             # Home page (/)
│   ├── Encounter._index.tsx   # /Encounter
│   ├── Encounter.$encounterId.tsx  # /Encounter/:encounterId
│   ├── Questionnaire._index.tsx
│   └── QuestionnaireResponse.$questionnaireResponseId.tsx
└── modules/                    # Feature modules
    ├── encounters/
    │   ├── actions/           # Business logic
    │   └── features/          # UI components
    ├── interview-call/
    │   ├── actions/
    │   └── features/
    └── questionnaire/
        ├── actions/
        └── features/
```

## React Router v7 Patterns

### File-Based Routing

Routes are defined by file names in `app/routes/`:

- `_index.tsx` → `/` (index route)
- `Encounter._index.tsx` → `/Encounter` (index within layout)
- `Encounter.$encounterId.tsx` → `/Encounter/:encounterId` (dynamic param)
- `$questionnaireResponseId.tsx` → `/:questionnaireResponseId` (catch-all param)

### Loader Functions (Data Fetching)

```typescript
// app/routes/Encounter.$encounterId.tsx
import { useLoaderData } from '@react-router/react'
import { Effect } from 'effect'

// Loader runs on server (in SPA mode, before render)
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { encounterId } = params

  // Use Effect-TS for business logic
  const program = Effect.gen(function* () {
    const repo = yield* EncounterRepository
    return yield* repo.get(encounterId)
  })

  // Provide layers and run
  const encounter = await Effect.runPromise(
    program.pipe(Effect.provide(InfrastructureLayer))
  )

  return { encounter }
}

// Component uses loader data
export default function EncounterPage() {
  const { encounter } = useLoaderData<typeof loader>()

  return <div>{encounter.status}</div>
}
```

### Action Functions (Mutations)

```typescript
// app/routes/Encounter._index.tsx
import { redirect } from '@react-router/react'

// Action handles form submissions and mutations
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const patientId = formData.get('patientId')

  const program = Effect.gen(function* () {
    const repo = yield* EncounterRepository
    const encounter = yield* repo.create({ patientId, status: 'planned' })
    return encounter
  })

  const encounter = await Effect.runPromise(
    program.pipe(Effect.provide(InfrastructureLayer))
  )

  // Redirect to new encounter
  return redirect(`/Encounter/${encounter.id}`)
}

// Form submits to action
export default function CreateEncounter() {
  return (
    <Form method="post">
      <input name="patientId" />
      <button type="submit">Create</button>
    </Form>
  )
}
```

### Error Boundaries

```typescript
// app/root.tsx or any route
export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    )
  }

  return <div>Something went wrong!</div>
}
```

## Tundra CSS Utility Classes

Tundra is a utility-first CSS framework. Common patterns:

## When to Use CSS Modules vs Tundra

### Use Tundra Utilities For

✅ Standard layouts (flex, grid)
✅ Spacing (padding, margin, gap)
✅ Typography (font-size, weight)
✅ Colors from design system
✅ Quick prototyping

### Use CSS Modules For

✅ Complex component-specific styles
✅ Animations and transitions
✅ Hover/focus states that aren't in Tundra
✅ Component variants with multiple style rules

```tsx
// Component.tsx
import styles from './Component.module.css'

export function Component() {
  return (
    <div className={`${styles.card} p-4`}>
      {/* Mix CSS Modules with Tundra utilities */}
    </div>
  )
}
```

## Effect-TS React Hooks

### useRuntime

```typescript
import { useRuntime } from '@assessmentis/react-util'

function MyComponent() {
  const runtime = useRuntime()

  const handleClick = async () => {
    const program = Effect.gen(function* () {
      const repo = yield* PatientRepository
      return yield* repo.get(patientId)
    })

    const patient = await Effect.runPromise(program, { runtime })
  }

  return <button onClick={handleClick}>Load Patient</button>
}
```

### useServiceSync

```typescript
import { useServiceSync } from '@assessmentis/react-util'

function MyComponent() {
  // Synchronously get service from runtime context
  const config = useServiceSync(ConfigService)

  return <div>{config.apiUrl}</div>
}
```

## Component File Structure

```
modules/
  feature-name/
    features/
      ComponentName.tsx          # Main component
      ComponentName.module.css   # CSS Module (if needed)
      ComponentName.test.tsx     # Component tests
      SubComponent.tsx           # Sub-components
    actions/
      featureActions.ts          # Business logic (Effect-TS)
      featureActions.test.ts     # Action tests (property-based)
```

**Naming:**

- PascalCase for component files: `NavHeader.tsx`
- camelCase for utility files: `clientRuntime.tsx`

## OpenTelemetry Tracing

Add spans to trace component rendering and async operations:

```typescript
import { trace } from '@opentelemetry/api'

const tracer = trace.getTracer('frontend')

function MyComponent() {
  useEffect(() => {
    const span = tracer.startSpan('load-patient-data')

    loadPatientData()
      .then(() => span.setStatus({ code: SpanStatusCode.OK }))
      .catch((error) => {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        })
      })
      .finally(() => span.end())
  }, [])
}
```

## Testing Components

### Property-Based Component Tests

```typescript
import { render, screen } from '@testing-library/react'
import { fc } from 'fast-check'

// Generate arbitrary props
const PatientCardPropsArb = fc.record({
  patientName: fc.string({ minLength: 1 }),
  age: fc.integer({ min: 0, max: 120 }),
  status: fc.constantFrom('active', 'inactive', 'discharged')
})

it('should render without errors for all valid props', () => {
  fc.assert(
    fc.property(PatientCardPropsArb, (props) => {
      const { container } = render(<PatientCard {...props} />)
      expect(container).toBeInTheDocument()
    })
  )
})
```

### MECE Component State Coverage

```typescript
describe('EncounterStatus', () => {
  describe('when status is planned', () => {
    it('should display planning indicator', () => {
      /* ... */
    })
  })

  describe('when status is in-progress', () => {
    it('should display active indicator', () => {
      /* ... */
    })
  })

  describe('when status is finished', () => {
    it('should display completion indicator', () => {
      /* ... */
    })
  })

  // Completely exhaustive - covers all possible states
})
```

## End-to-End Testing with Playwright

### Running E2E Tests

```bash
npm run test:e2e              # Run all E2E tests headless
npm run test:e2e:ui           # Open Playwright UI for interactive testing
npm run test:e2e:debug        # Debug tests with Playwright Inspector
npm run test:e2e:codegen      # Generate test code by recording actions
```

### Writing E2E Tests

**Location:** `apps/frontend/e2e/tests/`

**Test Structure:**
```typescript
import { test, expect } from '../../fixtures/auth'

test.describe('Feature Name', () => {
  test('should do something', async ({ authenticatedPage }) => {
    // Arrange: Navigate and set up
    await authenticatedPage.goto('/path')

    // Act: Perform user actions
    await authenticatedPage.click('button')

    // Assert: Verify expected outcomes
    await expect(authenticatedPage.locator('h1')).toContainText('Expected')
  })
})
```

### Using Playwright with Claude Code

Claude Code can interact with your running app via Playwright MCP:

1. **Start dev server:** `npm run dev`
2. **Ask Claude to interact:**
   - "Open the app in Playwright and navigate to /Encounter"
   - "Click the Create Encounter button and take a screenshot"
   - "Fill in the patient form and verify it submits"
3. **Visual verification:** Claude can take screenshots at each step
4. **Generate tests:** Claude can convert manual interactions into test code

### Best Practices

- Use `data-testid` attributes for stable selectors
- Test user workflows, not implementation details
- Include happy path AND error scenarios
- Use fixtures for authentication and common setup
- Take screenshots for visual verification
- Run tests in CI/CD before merging

## Common Patterns

### Conditional Rendering

```tsx
{
  isLoading ? <Spinner /> : <Content data={data} />
}
{
  error && <ErrorMessage error={error} />
}
{
  items.length > 0 && <ItemList items={items} />
}
```

### Forms with React Router

```tsx
import { Form, useNavigation } from '@react-router/react'

function MyForm() {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <Form method="post" action="/Encounter">
      <input name="patientId" required />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Encounter'}
      </button>
    </Form>
  )
}
```

### Loading States

```tsx
import { useNavigation } from '@react-router/react'

function Layout() {
  const navigation = useNavigation()
  const isLoading = navigation.state === 'loading'

  return (
    <div>
      {isLoading && <LoadingBar />}
      <Outlet />
    </div>
  )
}
```

## See Also

- [../../CLAUDE.md](../../CLAUDE.md) - Root project guidance
- [../../CONTRIBUTING.md](../../CONTRIBUTING.md) - Full contribution guidelines
- [Tundra CSS Docs](https://tundra-css.com) - Utility class reference
- [React Router Docs](https://reactrouter.com/en/main) - Router patterns and APIs
