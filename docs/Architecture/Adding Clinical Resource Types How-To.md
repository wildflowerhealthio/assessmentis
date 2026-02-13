# Adding Clinical Resource Types How-To

How to add a new FHIR R4 Clinical Resource end-to-end across domain and frontend layers.

For modeling rules and architecture context, see:

- [FHIR Modeling Reference](../../domain/clinical-domain/FHIR%20Modeling%20Reference.md)
- [Architecture Explanation](./Explanation.md)
- [Architecture Reference](./Reference.md)

## Goal

Add one Clinical Resource with full parity to existing Clinical Resources:

- Schema registered in domain `Schemas`
- Repository Tag registered in domain `Repositories`
- Frontend `ClinicalDataRepositoryService` supports effect + stream repository access
- Tests updated where resource registries are asserted
- Docs added in both domain and frontend locations

## Step 1: Add the domain Clinical Resource schema

Follow [domain/clinical-domain/docs/Adding Resource Types How-To.md](../../domain/clinical-domain/docs/Adding%20Resource%20Types%20How-To.md).

## Step 2: Add the domain Clinical Resource repository Tag

In `domain/clinical-domain/src/{category}/contexts/`:

- Add `{ResourceName}Repository.ts` as a `Context.Tag`
- Export it from the context `index.ts`
- Register the repository in `src/Repositories.ts`

The repository interface must be `ClinicalDataRepository<TResource>` for full CRUD + search parity.

## Step 3: Register schema and repository

In `domain/clinical-domain/src/Schemas.ts` and `domain/clinical-domain/src/Repositories.ts`:

- Add the new Clinical Resource entry
- Keep key names aligned with FHIR `resourceType` literals

## Step 4: Wire frontend repository service

In `apps/frontend/app/layers/ClinicalDataRepositoriesService.ts`:

- Import the new Clinical Resource schema
- Add entries in both `effect` and `stream`

This ensures route/actions/hooks can obtain the repository using the same generic Clinical Resource APIs.

## Step 5: Update tests

- Add or update schema property tests in domain package
- Update frontend service tests for the new Clinical Resource registry entry

## Step 6: Add docs and cross-links

- Domain workflow details: [domain/clinical-domain/docs/Adding Resource Types How-To.md](../../domain/clinical-domain/docs/Adding%20Resource%20Types%20How-To.md)
- Frontend workflow details: [apps/frontend/app/modules/resources/Adding Clinical Resource Types How-To.md](../../apps/frontend/app/modules/resources/Adding%20Clinical%20Resource%20Types%20How-To.md)

## Most-used code locations

- Domain schema registry: [../../domain/clinical-domain/src/Schemas.ts](../../domain/clinical-domain/src/Schemas.ts)
- Domain repository registry: [../../domain/clinical-domain/src/Repositories.ts](../../domain/clinical-domain/src/Repositories.ts)
- Repository factory: [../../domain/clinical-domain/src/assessmentis/makeClinicalDataRepository.ts](../../domain/clinical-domain/src/assessmentis/makeClinicalDataRepository.ts)
- Frontend repository service: [../../apps/frontend/app/layers/ClinicalDataRepositoriesService.ts](../../apps/frontend/app/layers/ClinicalDataRepositoriesService.ts)
