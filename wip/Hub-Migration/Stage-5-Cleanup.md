# Stage 5: Cleanup — Remove Old System

**Prerequisites:** Stages 1–4 complete (no consumer references ClinicalDataRepositoryService)
**Outcome:** All dead code removed, docs updated, codebase clean.

## Delete Files

1. `apps/frontend/app/layers/ClinicalDataRepositoriesService.ts` — the old service implementation
2. `apps/frontend/app/layers/ClinicalDataRepositoriesService.test.ts` — its tests
3. `apps/frontend/app/layers/clinicalDataRepositoryLayers.bak` — dead backup file

## Modify Files

### `apps/frontend/app/layers/PlatformContext.tsx`

Remove `clinicalDataRepositoryService` from the interface and remove the `ClinicalDataRepositoryService` type import:

```typescript
// Remove this line:
import type { ClinicalDataRepositoryService } from './ClinicalDataRepositoriesService'

// Remove this field from PlatformContext interface:
clinicalDataRepositoryService: typeof ClinicalDataRepositoryService.Service
```

### `apps/frontend/app/layers/PlatformContextProvider.tsx`

1. Remove `ClinicalDataRepositoryService` import (line 28):
   ```typescript
   // Remove:
   import { ClinicalDataRepositoryService } from './ClinicalDataRepositoriesService'
   ```

2. Remove the ClinicalDataRepositoryService creation block (lines 63-70):
   ```typescript
   // Remove this entire block:
   const clinicalDataRepositoryService =
     yield* ClinicalDataRepositoryService.pipe(
       Effect.provide(
         ClinicalDataRepositoryService.Default.pipe(
           Layer.provide(Layer.succeed(FhirR4ClientService, fhirR4ClientService))
         )
       )
     )
   ```

3. Remove `clinicalDataRepositoryService` from the return object (line 82):
   ```typescript
   // Remove:
   clinicalDataRepositoryService,
   ```

4. Check if `FhirR4ClientService` and `Layer` imports are still needed for other code. Remove if unused.

### `apps/frontend/app/layers/PlatformContextProvider.test.tsx`

Remove any references to `ClinicalDataRepositoryService`. Update mock setup if it referenced the service.

### `apps/frontend/app/test-utils.ts`

Remove `clinicalDataRepositoryService` from `createMockPlatformContext`:

```typescript
// Remove:
clinicalDataRepositoryService: neverUsedMock('clinicalDataRepositoryService'),
```

## Verify No Remaining References

Run these greps — all should return zero results in non-test, non-doc files:

```bash
# No remaining ClinicalDataRepositoryService references
grep -r "ClinicalDataRepositoryService\|ClinicalDataRepositoryServiceType\|clinicalDataRepositoryService" \
  apps/frontend/app/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# No remaining repository stream/effect patterns
grep -r "repositoryStream\|repositoryEffect" \
  apps/frontend/app/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# No remaining useEitherStream in route/module files (all should be useEffectTs)
grep -r "useEitherStream" \
  apps/frontend/app/routes/ apps/frontend/app/modules/ --include="*.ts" --include="*.tsx"

# No remaining StreamEither in route/module files
grep -r "StreamEither" \
  apps/frontend/app/routes/ apps/frontend/app/modules/ --include="*.ts" --include="*.tsx"

# No remaining individual repo tag imports in frontend (outside clinical-domain itself)
grep -r "from '@assessmentis/clinical-domain/repositories'" \
  apps/frontend/app/ --include="*.ts" --include="*.tsx"
```

## Update Documentation

### `apps/frontend/app/layers/Platform Services Reference.md`

- Remove `ClinicalDataRepositoryService` from the service catalog
- Add `ClinicalHub` tag and describe hub access pattern
- Update the service dependency graph

### `apps/frontend/app/layers/Hub Integration Explanation.md`

- Update to reflect that migration is complete (remove "Migration Path" section or mark as done)
- Add concrete examples of the final patterns

### `apps/frontend/app/modules/resources/Resource CRUD Reference.md`

- Replace all examples that use `ClinicalDataRepositoryService` / individual repo tags with `ClinicalHub` + `Effect.request` patterns
- Update the CRUD operation reference table

### `apps/frontend/app/modules/resources/Adding Clinical Resource Types How-To.md`

- Update instructions: no longer need to add a repository tag usage in frontend
- New resource types just need to be added to `ResourceDataTypes` and the Hub's origin resolvers

## Final Verification

```bash
npm run typecheck && npm run test && npm run build
```

All three must pass. The build step catches any issues that typecheck alone might miss (like unused imports or dead code).
