# Adding Clinical Resource Types How-To

How to wire a new Clinical Resource in the frontend so it behaves like existing Clinical Resources.

For cross-layer and domain steps, see:

- [docs/Architecture/Adding Clinical Resource Types How-To.md](../../../../../docs/Architecture/Adding%20Clinical%20Resource%20Types%20How-To.md)
- [domain/clinical-domain/docs/Adding Resource Types How-To.md](../../../../../domain/clinical-domain/docs/Adding%20Resource%20Types%20How-To.md)

## 1. Register in ResourceDataTypes

Add the new Clinical Resource to [../../../../../domain/clinical-domain/src/ResourceDataTypes.ts](../../../../../domain/clinical-domain/src/ResourceDataTypes.ts):

- Import the resource type
- Add it to both the `ResourceDataTypes` type and const

The Hub ([../../layers/useHub.ts](../../layers/useHub.ts)) will automatically support get/search/create/subscribe for the new resource type.

## 2. Add origin definition support

Add the new resource type to the relevant origin definition(s) in the infrastructure packages (e.g., `GoogleFhirOriginDefinition`, `DailyCoOriginDefinition`) so the Hub can route requests.

## 3. Add or update resource module UI

When the Clinical Resource requires dedicated CRUD UI:

- Create module under `app/modules/resources/{ResourceName}`
- Add actions, schemas, hooks, and components
- Add route files in `app/routes/`

For implementation details, see [./Resource CRUD Reference.md](./Resource%20CRUD%20Reference.md).

## 4. Keep terminology consistent

Use `Clinical Resource` wording in docs, comments, and test naming for this workflow.

## Most-used code locations

- Hub access hook: [../../layers/useHub.ts](../../layers/useHub.ts)
- Resource data types: [../../../../../domain/clinical-domain/src/ResourceDataTypes.ts](../../../../../domain/clinical-domain/src/ResourceDataTypes.ts)
- Resource CRUD patterns: [./Resource CRUD Reference.md](./Resource%20CRUD%20Reference.md)
