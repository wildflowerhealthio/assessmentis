# Integration Testing with Record + Playback

Integration tests verify that infrastructure code correctly interacts with external HTTP APIs (Google Healthcare API, OAuth providers, etc.). This project uses **VCR-style record/playback testing** via the `@assessmentis/vcr-js` package to make these tests deterministic and fast.

## How It Works

The pattern captures real HTTP interactions as "tapes" and replays them during test runs:

1. **Record mode** (`RECORD=true`): Tests hit the real API, and all HTTP requests/responses are saved as JSON5 files
2. **Playback mode** (default): Tests use saved tapes instead of making real HTTP calls

This gives you the confidence of real API integration with the speed and determinism of mocked tests.

## Architecture

`@assessmentis/vcr-js` combines two libraries:

- **[MSW](https://mswjs.io/)** - Intercepts HTTP requests at the network level
- **[Talkback](https://github.com/ijpiantanida/talkback)** - Records and matches HTTP interactions to tape files

```
Your Code → MSW Intercept → Talkback → Real API (record) or Tape File (playback)
```

## Setting Up Integration Tests

### 1. Vitest Configuration

Create a `vitest.config.ts` that uses a setup file:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/helpers/test-config.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run sequentially to avoid tape conflicts
    maxWorkers: 1,
  },
})
```

### 2. Test Config Setup File

Create `test/helpers/test-config.ts` to configure the VCR server:

```typescript
import { http, HttpResponse } from 'msw'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { setupInterceptServer } from '@assessmentis/vcr-js'

// Any handlers for mock endpoints (e.g., auth metadata)
const mockHandlers = [
  http.get('http://metadata.google.internal/*', () => {
    return HttpResponse.json({ access_token: 'mock-token' })
  }),
]

const mswServer = await setupInterceptServer({
  mswSetup: setupServer,
  tapePath: __dirname + '/../tapes/',
  handlers: mockHandlers,
  hosts: [
    {
      name: 'Google Healthcare API',
      host: 'https://healthcare.googleapis.com',
      urlSubstitutions: [
        // Normalize long FHIR paths
        [/\/v1\/projects\/.*\/fhir/, 'FHIR'],
        // Replace UUIDs with placeholder for stable matching
        [/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ':uuid'],
      ],
    },
  ],
})

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())
```

### 3. URL Substitutions

The `urlSubstitutions` option normalizes dynamic URL parts for stable tape matching:

| Pattern | Purpose |
|---------|---------|
| UUID regex → `:uuid` | Same tape works for any generated ID |
| Long paths → `FHIR` | Shorter, readable tape filenames |
| Timestamps → `:ts` | Normalize time-based parameters |

## Writing Integration Tests

Tests look like normal Vitest tests. The VCR layer is transparent:

```typescript
import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import { Effect, Exit } from 'effect'
import { FhirR4Client } from '@assessmentis/fhir-client'
import { LiveTestLayer, testConfig } from '../helpers/test-config'
import { createTracker } from '../helpers/cleanup'

describe('Patient', () => {
  const tracker = createTracker()

  afterEach(async () => {
    // Cleanup resources created during recording
    if (tracker.count > 0) {
      await Effect.runPromise(
        tracker.cleanup().pipe(Effect.provide(LiveTestLayer))
      )
    }
  })

  it('should create a patient and return with generated ID', async () => {
    const program = Effect.gen(function* () {
      const client = yield* FhirR4Client
      return yield* client.create({
        type: 'Patient',
        resource: { resourceType: 'Patient', name: [{ given: ['Test'] }] },
      })
    }).pipe(Effect.provide(LiveTestLayer))

    const exit = await Effect.runPromiseExit(program)

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.resourceType).toBe('Patient')
      tracker.track('Patient', exit.value.id)
    }
  })
})
```

## Recording New Tapes

To record interactions against the real API:

```bash
RECORD=true npm run test
```

This creates tape files organized by test name:

```
test/tapes/
└── Patient/
    └── create/
        └── should create a patient.../
            └── Google Healthcare API/
                ├── POST__FHIR__Patient__2026-01-28T22:39:50.json5
                └── DELETE__FHIR__Patient__:uuid__2026-01-28T22:39:51.json5
```

### Recording Prerequisites

Before recording, ensure:

1. You have valid credentials (e.g., `gcloud auth login`)
2. Environment variables are set (API keys, project IDs, etc.)
3. The test environment/store exists and is accessible

## Tape File Format

Tapes are JSON5 files containing the full request/response:

```json5
{
  meta: {
    createdAt: '2026-01-28T22:39:50.419Z',
    host: 'https://healthcare.googleapis.com',
  },
  req: {
    url: '/v1/projects/.../fhir/Patient',
    method: 'POST',
    body: 'base64-encoded-body',
  },
  res: {
    status: 201,
    headers: { 'content-type': ['application/fhir+json'] },
    body: { resourceType: 'Patient', id: '...' },
  },
}
```

## Best Practices

### Test Structure
- **Assert structure, not content**: Data may vary between recordings. Check that `resourceType === 'Patient'` rather than `name === 'John'`
- **Track resources for cleanup**: Use a tracker to delete created resources after each test (especially in record mode)

### Tape Maintenance
- **Commit tapes**: Tape files should be committed to the repository so CI runs in playback mode
- **Re-record when APIs change**: If an API changes its response format, delete old tapes and re-record
- **Use substitutions liberally**: Any dynamic value (IDs, timestamps) should have a substitution pattern

### Test Isolation
- **Run sequentially**: Use `maxWorkers: 1` to prevent tape conflicts
- **Reset handlers after each test**: `afterEach(() => mswServer.resetHandlers())`

## When to Use Integration Tests

| Use Integration Tests For | Use Unit Tests For |
|--------------------------|-------------------|
| Infrastructure packages that call external APIs | Pure domain logic |
| Verifying correct HTTP request construction | Schema validation |
| Testing error handling from real API responses | Business rules |
| OAuth/auth flows | Data transformations |

## See Also

- [Unit Testing](./unit-testing.md) - Property-based testing for pure domain logic
- [React Unit Testing](./react-unit-testing.md) - Testing React components
- [google-fhir-node-infrastructure tests](../../infrastructure/google-fhir-node-infrastructure/test/) - Working example
