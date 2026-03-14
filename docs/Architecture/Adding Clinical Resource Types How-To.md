# Adding Clinical Resource Types How-To

How to add a new FHIR R4 Clinical Resource end-to-end across domain and frontend layers.

For modeling rules and architecture context, see:

- [FHIR Modeling Reference](../../domain/clinical-domain/docs/FHIR%20Modeling%20Reference.md)
- [Architecture Explanation](./Explanation.md)
- [Architecture Reference](./Reference.md)

## Goal

Add one Clinical Resource with full parity to existing Clinical Resources:

- Schema defined in `domain/clinical-domain/src/resources/`
- Registered in `ResourceDataTypes`
- Origin definitions updated so the Hub can route requests
- Tests updated where resource registries are asserted
- Docs added in both domain and frontend locations

## Step 1: Add the domain Clinical Resource schema

Follow [domain/clinical-domain/docs/Adding Resource Types How-To.md](../../domain/clinical-domain/docs/Adding%20Resource%20Types%20How-To.md).

## Step 2: Register in ResourceDataTypes

Add the new Clinical Resource to [domain/clinical-domain/src/ResourceDataTypes.ts](../../domain/clinical-domain/src/ResourceDataTypes.ts):

- Import the resource type
- Add it to both the `ResourceDataTypes` type and const

The Hub (`ClinicalDomainHub`) will automatically support get/search/create/subscribe for the new resource type.

## Step 3: Add origin definition support

Add the new resource type to the relevant origin definition(s) in the infrastructure packages (e.g., `GoogleFhirOriginDefinition`, `DailyCoOriginDefinition`) so the Hub can route requests.

## Step 4: Wire frontend UI (if needed)

Follow [apps/frontend/app/modules/resources/Adding Clinical Resource Types How-To.md](../../apps/frontend/app/modules/resources/Adding%20Clinical%20Resource%20Types%20How-To.md) for module structure, routes, and CRUD patterns.

## Step 5: Update tests

- Add or update schema property tests in domain package
- Verify Hub integration tests cover the new resource type

## Step 6: Add docs and cross-links

- Domain workflow details: [domain/clinical-domain/docs/Adding Resource Types How-To.md](../../domain/clinical-domain/docs/Adding%20Resource%20Types%20How-To.md)
- Frontend workflow details: [apps/frontend/app/modules/resources/Adding Clinical Resource Types How-To.md](../../apps/frontend/app/modules/resources/Adding%20Clinical%20Resource%20Types%20How-To.md)

## Most-used code locations

- Domain schema registry: [../../domain/clinical-domain/src/Schemas.ts](../../domain/clinical-domain/src/Schemas.ts)
- Domain resource data types: [../../domain/clinical-domain/src/ResourceDataTypes.ts](../../domain/clinical-domain/src/ResourceDataTypes.ts)
- Hub Tag: [../../domain/clinical-domain/src/ClinicalDomainHub.ts](../../domain/clinical-domain/src/ClinicalDomainHub.ts)
- Frontend Hub hook: [../../apps/frontend/app/layers/useHub.ts](../../apps/frontend/app/layers/useHub.ts)
- Google FHIR origin definition: [../../infrastructure/google-account-infrastructure/src/GoogleFhirOriginDefinition.ts](../../infrastructure/google-account-infrastructure/src/GoogleFhirOriginDefinition.ts)
- Daily.co origin definition: [../../infrastructure/daily-co-infrastructure/src/DailyCoOriginDefinition.ts](../../infrastructure/daily-co-infrastructure/src/DailyCoOriginDefinition.ts)
