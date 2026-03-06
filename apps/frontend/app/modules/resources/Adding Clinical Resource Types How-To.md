# Adding Clinical Resource Types How-To

How to wire a new Clinical Resource in the frontend so it behaves like existing Clinical Resources.

For cross-layer and domain steps, see:

- [docs/Architecture/Adding Clinical Resource Types How-To.md](../../../../../docs/Architecture/Adding%20Clinical%20Resource%20Types%20How-To.md)
- [domain/clinical-domain/docs/Adding Resource Types How-To.md](../../../../../domain/clinical-domain/docs/Adding%20Resource%20Types%20How-To.md)

## 1. Wire ClinicalDataRepositoryService

Update [../../layers/ClinicalDataRepositoriesService.ts](../../layers/ClinicalDataRepositoriesService.ts):

- Import the new Clinical Resource schema from `@assessmentis/clinical-domain/{category}`
- Add `clientEffect` entry under `effect`
- Add `clientStream` entry under `stream`

This enables the same runtime repository behavior as all other Clinical Resources.

## 2. Update service tests

Update [../../layers/ClinicalDataRepositoriesService.test.ts](../../layers/ClinicalDataRepositoriesService.test.ts):

- Add the Clinical Resource type string to the resource registry test list
- Keep assertions for full repository method surface

## 3. Add or update resource module UI

When the Clinical Resource requires dedicated CRUD UI:

- Create module under `app/modules/resources/{ResourceName}`
- Add actions, schemas, hooks, and components
- Add route files in `app/routes/`

For implementation details, see [./Resource CRUD Reference.md](./Resource%20CRUD%20Reference.md).

## 4. Keep terminology consistent

Use `Clinical Resource` wording in docs, comments, and test naming for this workflow.

## Most-used code locations

- Repository service wiring: [../../layers/ClinicalDataRepositoriesService.ts](../../layers/ClinicalDataRepositoriesService.ts)
- Repository service tests: [../../layers/ClinicalDataRepositoriesService.test.ts](../../layers/ClinicalDataRepositoriesService.test.ts)
- Resource CRUD patterns: [./Resource CRUD Reference.md](./Resource%20CRUD%20Reference.md)
