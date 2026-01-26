# Daily.co Infrastructure Testing

This package includes comprehensive record+replay testing for the Daily.co integration, following the same pattern as the `google-fhir-node-infrastructure` package.

## Test Structure

The testing infrastructure is organized into:

- **`test/live/`** - Live tests that run against the real Daily.co API
- **`test/replay/`** - Replay tests that use recorded fixtures with MSW
- **`test/handlers/`** - MSW request handlers for mocking API responses
- **`test/helpers/`** - Utility functions (fixture loader, recorder, cleanup)
- **`test/setup/`** - Test configuration and setup files
- **`test/fixtures/`** - Recorded API responses for replay tests

## Running Tests

### Replay Tests (Default)

Replay tests use pre-recorded fixtures and don't require Daily.co API credentials:

```bash
npm test
```

These tests:
- Run quickly (no network calls)
- Work in CI/CD without credentials
- Verify correct handling of API responses

### Live Tests

Live tests run against the real Daily.co API and require valid credentials:

```bash
# First, copy .env.example to .env and add your API key
cp .env.example .env
# Edit .env and set DAILYCO_API_KEY

# Run live tests
npm run test:live
```

### Recording Fixtures

To update fixtures from live API responses:

```bash
RECORD_FIXTURES=true npm run test:live:record
```

This will:
1. Run tests against the real Daily.co API
2. Record API responses as JSON fixtures
3. Save fixtures in `test/fixtures/` for replay tests

## Test Coverage

Current test coverage includes:

### Room Operations
- ✅ Create room with various configurations
- ✅ Extract room name from Daily.co URL
- ✅ Get recordings for a room

### Error Scenarios
- ✅ 401 Unauthorized (invalid API key)
- ✅ 403 Forbidden (insufficient permissions)
- ✅ 404 Not Found (non-existent resource)

## Architecture

### Live Tests

Live tests use the real Daily.co API via the `DailyCoExternalVideoCallClientLayer`:

```typescript
const program = Effect.gen(function* () {
  const client = yield* ExternalVideoCallClient
  const result = yield* client.createRoom(params)
  return result
}).pipe(Effect.provide(LiveTestLayer))
```

### Replay Tests

Replay tests use MSW to intercept HTTP requests and return fixtures:

```typescript
const fixture = loadFixture('room', 'create-success')
mswServer.use(createRoomHandler(fixture))

const program = Effect.gen(function* () {
  const client = yield* ExternalVideoCallClient
  const result = yield* client.createRoom(params)
  return result
}).pipe(Effect.provide(ReplayTestLayer))
```

## Configuration

### Environment Variables

- `DAILYCO_API_KEY` - Your Daily.co API key (required for live tests)
- `DAILYCO_PROXY_URL` - Daily.co API base URL (defaults to `https://api.daily.co/v1`)
- `RECORD_FIXTURES` - Set to `true` to record fixtures during live tests

### Test Config

Configuration is managed in `test/setup/test-config.ts`:

```typescript
export const testConfig = {
  apiKey: process.env.DAILYCO_API_KEY || 'test-api-key',
  dailyCoProxyUrl: process.env.DAILYCO_PROXY_URL || 'https://api.daily.co/v1',
}
```

## Adding New Tests

### 1. Add a Live Test

Create a new test in `test/live/`:

```typescript
it('should do something', async () => {
  const program = Effect.gen(function* () {
    const client = yield* ExternalVideoCallClient
    const result = yield* client.someOperation(params)
    return result
  }).pipe(Effect.provide(LiveTestLayer))

  const exit = await Effect.runPromiseExit(program)
  
  expect(Exit.isSuccess(exit)).toBe(true)
  if (Exit.isSuccess(exit)) {
    // Record fixture for replay
    recorder.record(
      'operation-success',
      { method: 'POST', endpoint: 'something', body: params },
      { status: 200, body: exit.value },
      'Description of the fixture'
    )
  }
})
```

### 2. Record Fixtures

Run with recording enabled:

```bash
RECORD_FIXTURES=true npm run test:live
```

### 3. Add a Replay Test

Create corresponding replay test in `test/replay/`:

```typescript
it('should do something', async () => {
  const fixture = loadFixture('resource', 'operation-success')
  mswServer.use(createSomeHandler(fixture))

  const program = Effect.gen(function* () {
    const client = yield* ExternalVideoCallClient
    const result = yield* client.someOperation(params)
    return result
  }).pipe(Effect.provide(ReplayTestLayer))

  const exit = await Effect.runPromiseExit(program)
  
  expect(Exit.isSuccess(exit)).toBe(true)
  if (Exit.isSuccess(exit)) {
    expect(exit.value).toEqual(fixture.response.body)
  }
})
```

## Benefits of Record+Replay Testing

1. **Fast CI/CD**: Replay tests run quickly without network calls
2. **No Credentials Needed**: CI can run tests without API keys
3. **Deterministic**: Same fixtures produce same results every time
4. **Real API Validation**: Live tests verify against actual API behavior
5. **Easy Updates**: Re-record fixtures when API changes

## Related Documentation

- [Google FHIR Node Infrastructure](../google-fhir-node-infrastructure/README.md) - Reference implementation
- [Daily.co API Documentation](https://docs.daily.co/reference/rest-api)
- [MSW Documentation](https://mswjs.io/)
- [Vitest Documentation](https://vitest.dev/)
