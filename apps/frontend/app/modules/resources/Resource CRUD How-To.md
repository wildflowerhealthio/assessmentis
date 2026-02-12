# Resource CRUD How-To

How to implement full CRUD for a new FHIR resource in the frontend. For design patterns, see [Design Reference](../../../Design%20Reference.md).

## Module Structure

Create under `app/modules/resources/{ResourceName}/`:

```plaintext
modules/resources/{ResourceName}/
  components/
    {ResourceName}Form.tsx
    {ResourceName}List.tsx
    {ResourceName}ListItem/
      {ResourceName}ListItem.tsx
      {ResourceName}ListItem.module.css
  schemas/
    {ResourceName}FormSchema.ts
    {ResourceName}FormSchema.test.ts
  actions/
    create{ResourceName}.ts
    update{ResourceName}.ts
  hooks/
    use{ResourceName}Collection.ts
```

## 1. Form Schema

```typescript
import { Schema } from 'effect'

export const PatientFormSchema = Schema.Struct({
  givenName: Schema.optional(Schema.String),
  familyName: Schema.optional(Schema.String),
  birthDate: Schema.optional(Schema.DateTimeUtc),
})

export type PatientFormData = typeof PatientFormSchema.Type
```

## 2. Form Component

Use `ResourceForm` with `applyPartialProps` for simple fields, `transformProps` for pickers:

```typescript
import { applyPartialProps, transformProps } from '@assessmentis/react-util'
import { ResourceForm, TextField, DateField } from 'app/modules/common/components/ResourceForm'

export function PatientForm({ onSubmit, submitLabel, initialValues }) {
  return (
    <ResourceForm
      schema={PatientFormSchema}
      fields={{
        givenName: applyPartialProps(TextField, { name: 'givenName', label: 'Given Name' }),
        birthDate: applyPartialProps(DateField, { name: 'birthDate', label: 'Birth Date' }),
      }}
      fieldOrder={['givenName', 'birthDate']}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={initialValues}
    />
  )
}
```

For pickers:

```typescript
pickerId: transformProps(
  PatientPicker,
  (props: CommonFieldProps<string | undefined>) => ({
    name: 'pickerId',
    label: 'Patient',
    picking: {
      onChange: props.onChange,
      value: props.value,
      multiple: false as const,
    },
  })
)
```

## 3. Actions

**Create:**

```typescript
export const createPatient = (formData: PatientFormData) =>
  Effect.gen(function* () {
    const repo = yield* PatientRepository
    return yield* repo.create({
      /* map formData to FHIR resource */
    })
  })
```

**Update:** Spread the current resource and override with form data to preserve unchanged fields:

```typescript
export const updatePatient = (
  id: PatientId,
  current: Patient,
  formData: PatientFormData
) =>
  Effect.gen(function* () {
    const repo = yield* PatientRepository
    return yield* repo.update({ ...current, id /* override with formData */ })
  })
```

## 4. Collection Hook

```typescript
export const usePatientCollection = (filters: object) => {
  const patients = useResourceRunEffect(
    useMemo(
      () =>
        Effect.gen(function* () {
          const repo = yield* PatientRepository
          return yield* repo.getMany(filters)
        }),
      [filters]
    )
  )
  return useClinicalDataCollection(PatientRepository, patients)
}
```

Returns `{ collection, deleteItem }`.

## 5. Routes

Create four route files in `app/routes/`:

| File                                      | Purpose     |
| ----------------------------------------- | ----------- |
| `_resource.Patient._index.tsx`            | List page   |
| `_resource.Patient.new.tsx`               | Create page |
| `_resource.Patient.$patientId._index.tsx` | Detail page |
| `_resource.Patient.$patientId.edit.tsx`   | Edit page   |

The `_resource.tsx` layout provides error boundaries for all resource routes.

**List page:** Use `usePatientCollection` + `LoadedResult.handle` for loading/error/success states.

**Detail/Edit pages:** Decode the URL param with `Schema.decodeOption(PatientId)`, fail with `NotFoundError` if invalid.

## 6. Optional: Picker

If the resource needs to be selectable in other forms, create a picker:

```typescript
export function PatientPicker(props: Omit<BasePickerProps<{patient: Patient}>, 'items' | 'loading'>) {
  const { items, loading, error } = usePickerData({
    repository: PatientRepository,
    transform: patientToPickerItem,
  })
  return <BasePicker {...props} items={items} loading={loading} />
}
```

## Date and Time Handling

| Type                  | Use for                              | Display                   |
| --------------------- | ------------------------------------ | ------------------------- |
| `DateTime.Utc`        | Server timestamps, encounter periods | Convert to local timezone |
| `DateTime.Zoned`      | Appointments, scheduled events       | Show in intended timezone |
| `string` (YYYY-MM-DD) | Birthdays, dates without times       | Show as-is                |

Utilities in `app/modules/common/utils/dateUtils.ts`:

- `formatUtcDate(timestamp)` — smart year handling ("January 15th" or "January 15th, 2024")
- `formatUtcDateRange(start, end)` — smart range ("December 31st 9:00 AM - 10:30 AM")
- `formatTimelessDate(dateString)` — for birthdays

## FHIR References in UI

References use format `"ResourceType/id"`:

```typescript
// Extract ID
const patientId = observation.subject?.reference?.split('/')[1]

// Create link
<Link to={`/${resource.subject.reference}`}>{resource.subject.display}</Link>

// Filter by reference
const filter = { subject: `Patient/${patientId}` }
```

## Reference Implementation

Patient has the most complete CRUD implementation. See:

- Routes: `app/routes/_resource.Patient.*`
- Module: `app/modules/resources/Patient/`

## See Also

- [Design Reference](../../../Design%20Reference.md) — Typography, colors, spacing tokens
