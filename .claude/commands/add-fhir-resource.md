# add-fhir-resource

Add a new FHIR R4 resource type to clinical-domain with proper validation and tests.

**Resource type:** $ARGUMENTS

## Steps

1. Reference FHIR R4 specification: [https://hl7.org/fhir/R4/$ARGUMENTS.html](https://hl7.org/fhir/R4/$ARGUMENTS.html)
2. Create resource schema in `domain/clinical-domain/src/resources/$ARGUMENTS.ts`
3. Define schema using Effect Schema following FHIR R4 structure exactly
4. Add JSDoc comments documenting resource purpose
5. Create round-trip property test in `domain/clinical-domain/src/resources/$ARGUMENTS.test.ts`
6. Add to barrel export in `domain/clinical-domain/src/index.ts`
7. Run `npm run typecheck` to verify types
8. Run `npm run test` to verify tests pass
9. Commit with message: "Add FHIR $ARGUMENTS resource"

## Example Resource Schema

```typescript
import { Schema } from 'effect'

/**
 * FHIR R4 $ARGUMENTS resource.
 * Reference: https://hl7.org/fhir/R4/$ARGUMENTS.html
 */
export const $ARGUMENTS = Schema.Struct({
  resourceType: Schema.Literal('$ARGUMENTS'),
  id: Schema.String,
  meta: Schema.optional(
    Schema.Struct({
      versionId: Schema.optional(Schema.String),
      lastUpdated: Schema.optional(Schema.DateFromString),
    })
  ),
  // ... follow FHIR R4 spec exactly
})

export type $ARGUMENTS = Schema.Schema.Type<typeof $ARGUMENTS>
```

## Required Round-Trip Test

```typescript
import { fc } from 'fast-check'
import { Schema } from 'effect'
import { $ARGUMENTS } from './$ARGUMENTS'

describe('$ARGUMENTS FHIR Resource', () => {
  it('should round-trip correctly', () => {
    fc.assert(
      fc.property(Schema.arbitrary($ARGUMENTS)(fc), (data) => {
        const encoded = Schema.encodeSync($ARGUMENTS)(data)
        const decoded = Schema.decodeSync($ARGUMENTS)(encoded)
        expect(decoded).toEqual(data)
      })
    )
  })

  it('should validate required fields', () => {
    const invalid = { resourceType: '$ARGUMENTS' } // missing id
    expect(() => Schema.decodeSync($ARGUMENTS)(invalid)).toThrow()
  })
})
```

## Critical Rules

⚠️ **NEVER modify FHIR schemas without domain expert review**
⚠️ Follow FHIR R4 specification EXACTLY
⚠️ All FHIR resources MUST have round-trip property tests
⚠️ Use Effect Schema for both compile-time and runtime validation
