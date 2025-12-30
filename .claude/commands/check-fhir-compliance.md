# check-fhir-compliance

Verify FHIR R4 compliance for clinical data structures.

**Resource path:** $ARGUMENTS

## Steps

1. Read resource schema definition at `$ARGUMENTS`
2. Identify resource type from schema (e.g., `Patient`, `Encounter`, `Observation`)
3. Fetch FHIR R4 specification: https://hl7.org/fhir/R4/[resourceType].html
4. **Verify schema compliance:**
   - Check all required fields are present
   - Verify field types match FHIR spec (string, code, dateTime, etc.)
   - Check cardinality (0..1, 1..1, 0..*, 1..*)
   - Verify value sets for coded fields
5. **Check for round-trip tests:**
   - Look for corresponding `.test.ts` file
   - Verify round-trip property test exists
   - Check test uses `Schema.arbitrary` with fast-check
6. **Verify runtime validation:**
   - Ensure Effect Schema is used
   - Check both encoding and decoding are defined
   - Verify error handling for invalid data
7. **Report findings:**
   - List any compliance issues found
   - Suggest fixes for non-compliant fields
   - Note missing tests
   - Highlight any critical violations

## Compliance Checklist

### Schema Structure
- [ ] Follows FHIR R4 specification exactly
- [ ] `resourceType` field with correct Literal type
- [ ] `id` field (required for most resources)
- [ ] All required FHIR fields present
- [ ] Optional fields marked with `Schema.optional()`
- [ ] Nested structures use `Schema.Struct()`

### Data Types
- [ ] String fields use `Schema.String`
- [ ] Date fields use `Schema.DateFromString`
- [ ] Coded fields use `Schema.Literal()` or value sets
- [ ] Numeric fields use appropriate Schema types
- [ ] References use proper structure: `{ reference: string }`

### Testing
- [ ] Round-trip property test exists
- [ ] Test uses `Schema.arbitrary(Resource)(fc)`
- [ ] Test verifies encode → decode === identity
- [ ] Test file located next to schema file
- [ ] Test covers edge cases

### Documentation
- [ ] JSDoc comment with resource purpose
- [ ] Reference to FHIR spec URL
- [ ] Exported from package index

## Example Compliance Check

```typescript
// GOOD - FHIR Compliant
export const Patient = Schema.Struct({
  resourceType: Schema.Literal('Patient'),  // ✅ Required literal
  id: Schema.String,                         // ✅ Required id
  meta: Schema.optional(                     // ✅ Optional meta
    Schema.Struct({
      versionId: Schema.optional(Schema.String),
      lastUpdated: Schema.optional(Schema.DateFromString)
    })
  ),
  name: Schema.optional(                     // ✅ 0..* array
    Schema.Array(
      Schema.Struct({
        family: Schema.optional(Schema.String),
        given: Schema.optional(Schema.Array(Schema.String))
      })
    )
  )
})

// BAD - Not FHIR Compliant
export const Patient = Schema.Struct({
  // ❌ Missing resourceType
  patientId: Schema.String,                  // ❌ Should be 'id'
  fullName: Schema.String,                   // ❌ Should be 'name' array
  birthdate: Schema.Date                     // ❌ Should be 'birthDate' with ISO string
})
```

## Critical FHIR Rules

⚠️ **NEVER modify FHIR schemas without domain expert review**

### Must Follow
1. **Exact field names** - FHIR is case-sensitive
2. **Correct data types** - String, Date, Code, etc.
3. **Proper cardinality** - Required vs optional, single vs array
4. **Value sets** - Use FHIR-defined codes when specified
5. **Resource structure** - Follow FHIR hierarchy exactly

### Common Mistakes to Avoid
- Using camelCase instead of FHIR names (e.g., `birthDate` not `birthdate`)
- Missing `resourceType` literal field
- Wrong cardinality (single value instead of array, or vice versa)
- Incorrect date format (use `Schema.DateFromString` for ISO 8601)
- Missing required fields per FHIR spec

## Report Format

```markdown
## FHIR Compliance Check: [ResourceType]

**File:** $ARGUMENTS
**FHIR Spec:** https://hl7.org/fhir/R4/[resourceType].html

### Compliance Status: ✅ PASS / ⚠️ WARNINGS / ❌ FAIL

### Issues Found:
1. [Critical] Missing required field: `status`
2. [Warning] Field `birthdate` should be `birthDate` per FHIR spec
3. [Info] Missing round-trip property test

### Recommendations:
- Add `status` field with appropriate value set
- Rename `birthdate` to `birthDate`
- Create `Patient.test.ts` with round-trip test

### Tests:
- [ ] Round-trip test exists
- [ ] Test uses fast-check arbitraries
- [ ] Edge cases covered
```

## See Also

- [FHIR R4 Specification](https://hl7.org/fhir/R4/)
- [domain/CLAUDE.md](../domain/CLAUDE.md) - FHIR resource guidelines
- [TESTING.md](../TESTING.md) - Property-based testing patterns
