# Frontend Patterns and Conventions

This document outlines the frontend patterns and conventions used in this project to ensure consistency and make implementing new features more efficient.

## File Structure and Naming Conventions

### Routes

Location: `/apps/frontend/app/routes/`

Naming pattern (all routes use `_resource.` prefix for error boundary):

- **List pages**: `_resource.ResourceName._index.tsx` (e.g., `_resource.Patient._index.tsx`)
- **Detail pages**: `_resource.ResourceName.$paramName._index.tsx` (e.g., `_resource.Patient.$patientId._index.tsx`)
- **Create pages**: `_resource.ResourceName.new.tsx` (e.g., `_resource.Patient.new.tsx`)
- **Edit pages**: `_resource.ResourceName.$paramName.edit.tsx` (e.g., `_resource.Patient.$patientId.edit.tsx`)

The `_resource.tsx` layout file provides a comprehensive error boundary for all resource routes. The framework uses file-based routing with React Router v7, and route types are auto-generated in `.react-router/types/`.

### Modules

Location: `/apps/frontend/app/modules/resources/{ResourceName}/`

Structure:

```
modules/
  resources/
    {ResourceName}/        (e.g., Patient, Practitioner, Observation)
      components/
        {ResourceName}Form.tsx      (extracted form component)
        {ResourceName}List.tsx      (list component)
        {ResourceName}Picker.tsx    (picker component)
      schemas/
        {ResourceName}FormSchema.ts      (form validation schema)
        {ResourceName}FormSchema.test.ts (schema tests)
      actions/
        create{ResourceName}.ts     (create action)
        update{ResourceName}.ts     (update action)
      hooks/
        use{ResourceName}Collection.ts  (collection management hook)
```

The modules organize resource-specific code (forms, actions, hooks) alongside reusable UI components

### Common UI Components

Location: `/apps/frontend/app/modules/common/components/`

These components provide consistent UI patterns across all resource pages:

**PageHeader** - Standardized page titles with optional subtitles

```typescript
import { PageHeader } from 'app/modules/common/components/PageHeader/PageHeader'

<PageHeader
  title="Patient Details"
  subtitle="Patient ID: 12345"
/>
```

**DetailPageActions** - Consistent back and edit button layout for detail pages

```typescript
import { DetailPageActions } from 'app/modules/common/components/DetailPageActions/DetailPageActions'

<DetailPageActions
  backTo="/Patient"
  editTo={`/Patient/${patient.id}/edit`}
  backLabel="← Back to Patients"
/>
```

**FormPage** - Consistent layout wrapper for create/edit pages

```typescript
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'

<FormPage title="Create New Patient">
  <PatientForm onSubmit={handleSubmit} submitLabel="Create Patient" />
</FormPage>
```

## Page Patterns

### List Pages

**Purpose**: Display a list of resources with link to create page and delete functionality

**Template**: [\_resource.Patient.\_index.tsx](app/routes/_resource.Patient._index.tsx)

**Standard structure**:

```typescript
import { Link } from 'react-router'
import { LoadedResult } from '@assessmentis/ontology'
import ResourceList from '../modules/resources/Resource/components/ResourceList'
import { useResourceCollection } from '../modules/resources/Resource/hooks/useResourceCollection'
import type { Route } from './+types/_resource.Resource._index'

const emptyFilters = {}

export default function ResourcePage(_: Route.ComponentProps) {
  const { collection: resources, deleteItem: deleteResource } =
    useResourceCollection(emptyFilters)

  return (
    <>
      <h1 className="heading-1">Resources</h1>
      <div style={{ marginTop: 'var(--space-4)' }}>
        <Link to="/Resource/new" className="button-2 blue">
          Create New Resource
        </Link>
      </div>
      {LoadedResult.handle(resources, {
        onLoading: () => <p>Loading resources...</p>,
        onError: (error) => <p>Error loading resources: {String(error)}</p>,
        onSuccess: (resourceList) => (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <ResourceList
              deleteResource={deleteResource}
              resources={resourceList}
            />
          </div>
        ),
      })}
    </>
  )
}
```

**List pages with filtering** (server-side):

```typescript
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url)
  const filterId = url.searchParams.get('filterId')

  const filter: any = {}
  if (filterId) filter.someField = `Reference/${filterId}`

  const runtime = await getRuntime()
  const resources = await runtime.runPromise(
    Effect.gen(function* () {
      const repo = yield* ResourceRepository
      return yield* repo.getMany(filter)
    })
  )

  return { resources, filters: { filterId } }
}

// In component:
const [searchParams, setSearchParams] = useSearchParams()

const handleFilterChange = (id: string | undefined) => {
  const newParams = new URLSearchParams(searchParams)
  if (id) {
    newParams.set('filterId', id)
  } else {
    newParams.delete('filterId')
  }
  setSearchParams(newParams)
}
```

### Detail Pages

**Purpose**: Display comprehensive details of a single resource with navigation to edit

**Template**: [\_resource.Patient.$patientId.\_index.tsx](app/routes/_resource.Patient.$patientId._index.tsx)

**Standard structure**:

```typescript
import { Effect, Option, Schema } from 'effect'
import { getRuntime } from 'app/clientRuntime'
import { DetailPageActions } from 'app/modules/common/components/DetailPageActions/DetailPageActions'
import {
  Resource,
  ResourceId,
  ResourceRepository,
} from '@assessmentis/clinical-domain/...'
import { NotFoundError } from '@assessmentis/ontology'
import type { Route } from './+types/_resource.Resource.$resourceId._index'

const tryDecodeResourceId = Schema.decodeOption(ResourceId)

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const resourceIdMaybe = tryDecodeResourceId(params.resourceId)

  const resource = await runtime.runPromise(
    Effect.gen(function* () {
      const repository = yield* ResourceRepository

      const resourceId = yield* resourceIdMaybe.pipe(
        Option.map(Effect.succeed),
        Option.getOrElse(() =>
          Effect.fail(
            new NotFoundError({
              resourceType: 'Resource',
              params: { id: params.resourceId },
            })
          )
        )
      )

      return yield* repository.get(resourceId)
    })
  )

  return { resource }
}

export default function ResourceDetailPage({ loaderData }: Route.ComponentProps) {
  const { resource } = loaderData

  return (
    <>
      <DetailPageActions
        backTo="/Resource"
        editTo={`/Resource/${resource.id}/edit`}
      />

      <h1 className="heading-1">{resource.displayName}</h1>
      <p className="subheading-3">{resource.id}</p>

      {/* Sections */}
      <section style={{ marginTop: 'var(--space-5)' }}>
        <h2 className="heading-3">Section Name</h2>
        {/* Content */}
      </section>

      {/* Raw Data */}
      <details style={{ marginTop: 'var(--space-7)' }}>
        <summary className="heading-3">Raw Data</summary>
        <pre style={{ ...}}>{JSON.stringify(resource, null, 2)}</pre>
      </details>
    </>
  )
}
```

### Create Pages

**Purpose**: Form page for creating new resources

**Template**: [\_resource.Patient.new.tsx](app/routes/_resource.Patient.new.tsx)

**Standard structure**:

```typescript
import { useNavigate } from 'react-router'
import { useRuntimeContext } from 'app/clientRuntime'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { ResourceForm } from 'app/modules/resources/Resource/components/ResourceForm'
import { createResource } from 'app/modules/resources/Resource/actions/createResource'
import { ResourceFormSchema } from 'app/modules/resources/Resource/schemas/ResourceFormSchema'

export default function CreateResourcePage() {
  const navigate = useNavigate()
  const clientRuntime = useRuntimeContext()

  const handleSubmit = async (data: typeof ResourceFormSchema.Type) => {
    const resource = await clientRuntime.runPromise(createResource(data))
    navigate(`/Resource/${resource.id}`)
  }

  // Provide default values to prevent uncontrolled input warnings
  const defaultValues: typeof ResourceFormSchema.Encoded = {
    field1: undefined,
    field2: undefined,
    // ... all fields with appropriate default values
  }

  return (
    <FormPage title="Create New Resource">
      <ResourceForm
        onSubmit={handleSubmit}
        submitLabel="Create Resource"
        initialValues={defaultValues}
      />
    </FormPage>
  )
}
```

### Edit Pages

**Purpose**: Form page for editing existing resources

**Template**: [\_resource.Patient.$patientId.edit.tsx](app/routes/_resource.Patient.$patientId.edit.tsx)

**Standard structure**:

```typescript
import { Effect, Option, Schema } from 'effect'
import { useNavigate } from 'react-router'
import { useLoadedRuntimeContext } from 'app/clientRuntime'
import { getRuntime } from 'app/clientRuntime'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { ResourceForm } from 'app/modules/resources/Resource/components/ResourceForm'
import { updateResource } from 'app/modules/resources/Resource/actions/updateResource'
import { ResourceFormSchema } from 'app/modules/resources/Resource/schemas/ResourceFormSchema'
import {
  Resource,
  ResourceId,
  ResourceRepository,
} from '@assessmentis/clinical-domain/...'
import { NotFoundError } from '@assessmentis/ontology'
import type { Route } from './+types/_resource.Resource.$resourceId.edit'

const tryDecodeResourceId = Schema.decodeOption(ResourceId)

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const resourceIdMaybe = tryDecodeResourceId(params.resourceId)

  const resource = await runtime.runPromise(
    Effect.gen(function* () {
      const repository = yield* ResourceRepository

      const resourceId = yield* resourceIdMaybe.pipe(
        Option.map(Effect.succeed),
        Option.getOrElse(() =>
          Effect.fail(
            new NotFoundError({
              resourceType: 'Resource',
              params: { id: params.resourceId },
            })
          )
        )
      )

      return yield* repository.get(resourceId)
    })
  )

  return { resource }
}

export default function EditResourcePage({ loaderData }: Route.ComponentProps) {
  const { resource } = loaderData
  const navigate = useNavigate()
  const clientRuntime = useLoadedRuntimeContext()

  // Transform resource to form initial values
  const initialValues: typeof ResourceFormSchema.Encoded = {
    field1: resource.field1,
    field2: resource.field2,
    // ... map all resource fields to form schema
  }

  const handleSubmit = async (data: typeof ResourceFormSchema.Type) => {
    if (!resource.id) return

    if (clientRuntime._tag != 'loaded') {
      console.error('Runtime not loaded', clientRuntime)
      return
    }

    await clientRuntime.value.runPromise(
      updateResource(resource.id, resource, data)
    )

    // Redirect back to detail page
    navigate(`/Resource/${resource.id}`)
  }

  return (
    <FormPage title="Edit Resource">
      <ResourceForm
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        initialValues={initialValues}
      />
    </FormPage>
  )
}
```

## Picker System

### BasePicker Architecture

All pickers extend from `BasePicker` component which provides:

- Searchable combobox UI (using Headless UI)
- Loading states
- Single and multiple selection modes
- Consistent styling

Location: `/apps/frontend/app/modules/common/components/BasePicker/`

### Creating a New Picker

**Template**: [PatientPicker.tsx](app/modules/patient/components/PatientPicker/PatientPicker.tsx)

**Steps**:

1. Create component file: `modules/{resource}/components/{Resource}Picker/{Resource}Picker.tsx`
2. Import repository and BasePicker components
3. Create transform function: `resourceToPickerItem`
4. Create picker component using `usePickerData` hook

**Example**:

```typescript
import {
  Resource,
  ResourceRepository,
} from '@assessmentis/clinical-domain/...'
import { BasePicker } from '../../../common/components/BasePicker/BasePicker'
import { usePickerData } from '../../../common/components/BasePicker/hooks/usePickerData'
import {
  BasePickerProps,
  PickerItem,
} from '../../../common/components/BasePicker/types/PickerTypes'

type ResourcePickerProps = Omit<
  BasePickerProps<{ resource: Resource }>,
  'items' | 'loading'
>

function formatResourceName(resource: Resource): string {
  // Format primary display text
  return resource.name || 'Unnamed Resource'
}

function resourceToPickerItem(
  resource: Resource
): PickerItem<{ resource: Resource }> {
  const displayName = formatResourceName(resource)
  const secondaryText = `${resource.field1} • ${resource.field2}`

  return {
    id: resource.id!,
    displayName,
    secondaryText,
    metadata: { resource },
  }
}

export function ResourcePicker(props: ResourcePickerProps) {
  const { items, loading, error } = usePickerData({
    repository: ResourceRepository,
    transform: resourceToPickerItem,
  })

  return (
    <BasePicker
      {...props}
      items={items}
      loading={loading}
      error={error?.message || props.error}
      immediate={props.immediate ?? true}
      placeholder={props.placeholder || 'Select a resource...'}
      label={props.label || 'Resource'}
    />
  )
}
```

**Export the picker**:
Add to `/apps/frontend/app/modules/common/components/BasePicker/index.ts`:

```typescript
export { ResourcePicker } from '../../../{resource}/components/ResourcePicker/ResourcePicker'
```

### Using Pickers

**Single selection**:

```typescript
<ResourcePicker
  picking={{
    value: selectedId,
    onChange: (id: string | undefined) => setSelectedId(id),
    multiple: false,
  }}
  label="Select Resource"
  placeholder="Choose a resource..."
/>
```

**Multiple selection**:

```typescript
<ResourcePicker
  picking={{
    value: selectedIds,
    onChange: (ids: ReadonlyArray<string> | undefined) => setSelectedIds(ids),
    multiple: true,
  }}
  label="Select Resources"
/>
```

## Form System

### ResourceForm

Location: `/apps/frontend/app/modules/common/components/ResourceForm/`

**Purpose**: Type-safe forms with Effect Schema validation

**Available field components**:

- `TextField` - Standard text input
- `TextAreaField` - Multi-line text input
- `SelectField` - Dropdown selector
- `DateField` - Date input
- `CheckboxField` - Boolean checkbox
- `PickerField` - Wrapper for picker components

**Example usage**:

```typescript
<ResourceForm
  schema={ResourceFormSchema}
  fields={{
    fieldName: applyPartialProps(TextField, {
      name: 'fieldName',
      label: 'Field Label',
      required: true,
    }),
    pickerId: transformProps(
      ResourcePicker,
      (props: CommonFieldProps<string | undefined>) => ({
        name: 'pickerId',
        label: 'Pick a Resource',
        picking: {
          onChange: props.onChange,
          value: props.value,
          multiple: false as const,
        },
      })
    ),
  }}
  fieldOrder={['fieldName', 'pickerId']}
  onSubmit={handleSubmit}
  submitLabel="Create Resource"
/>
```

## Resource Form Pattern

### Extracted Form Components

All resources follow a consistent pattern of extracting form logic into dedicated components.

**Location**: `modules/resources/{Resource}/components/{Resource}Form.tsx`

**Template**: [PatientForm.tsx](app/modules/resources/Patient/components/PatientForm.tsx)

**Standard structure**:

```typescript
import { applyPartialProps, transformProps } from '@assessmentis/react-util'
import {
  ResourceForm,
  DateField,
  TextField,
} from 'app/modules/common/components/ResourceForm'
import { CommonFieldProps } from 'app/modules/common/components/ResourceForm/ResourceForm'
import {
  ResourceFormSchema,
  type ResourceFormData,
} from '../schemas/ResourceFormSchema'

interface ResourceFormProps {
  onSubmit: (data: ResourceFormData) => void | Promise<void>
  submitLabel: string
  initialValues?: Partial<typeof ResourceFormSchema.Encoded>
}

export function ResourceForm({
  onSubmit,
  submitLabel,
  initialValues,
}: ResourceFormProps) {
  return (
    <ResourceForm
      schema={ResourceFormSchema}
      fields={{
        textField: applyPartialProps(TextField, {
          name: 'textField',
          label: 'Text Field',
          required: true,
        }),
        dateField: applyPartialProps(DateField, {
          name: 'dateField',
          label: 'Date',
        }),
        pickerId: transformProps(
          SomePicker,
          (props: CommonFieldProps<string | undefined>) => ({
            name: 'pickerId',
            label: 'Pick Something',
            picking: {
              onChange: props.onChange,
              value: props.value,
              multiple: false as const,
            },
          })
        ),
      }}
      fieldOrder={['textField', 'dateField', 'pickerId']}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={initialValues}
    />
  )
}
```

**Key points**:

- Use `applyPartialProps` for simple fields (TextField, DateField, etc.)
- Use `transformProps` for picker components to adapt props
- Always export type for form data from schema
- Accept optional `initialValues` for edit forms
- Use `typeof Schema.Type` for runtime data, `typeof Schema.Encoded` for initial values

## Action Pattern

All resources have dedicated action files for create/update operations using Effect.

**Location**: `modules/resources/{Resource}/actions/`

### Create Action

**Template**: [createPatient.ts](app/modules/resources/Patient/actions/createPatient.ts)

```typescript
import { Effect } from 'effect'
import { Resource, ResourceRepository } from '@assessmentis/clinical-domain/...'
import { UnhandledError } from '@assessmentis/ontology'
import { ResourceFormData } from '../schemas/ResourceFormSchema'

export const createResource = (
  formData: ResourceFormData
): Effect.Effect<Resource, UnhandledError, ResourceRepository> => {
  return Effect.gen(function* () {
    const repository = yield* ResourceRepository

    const resource: Resource = {
      // Transform form data to resource shape
      field1: formData.field1,
      field2: formData.field2,
      // ...
    }

    return yield* repository.create(resource)
  })
}
```

### Update Action

**Template**: [updatePatient.ts](app/modules/resources/Patient/actions/updatePatient.ts)

```typescript
import { Effect } from 'effect'
import {
  Resource,
  ResourceId,
  ResourceRepository,
} from '@assessmentis/clinical-domain/...'
import {
  UnhandledError,
  NeedsAuthenticationError,
  NotFoundError,
} from '@assessmentis/ontology'
import { WithId } from '@assessmentis/clinical-domain/data-types'
import { ResourceFormData } from '../schemas/ResourceFormSchema'

export const updateResource = (
  id: ResourceId,
  currentResource: Resource,
  formData: ResourceFormData
): Effect.Effect<
  Resource,
  UnhandledError | NeedsAuthenticationError | NotFoundError,
  ResourceRepository
> => {
  return Effect.gen(function* () {
    const repository = yield* ResourceRepository

    // Merge form data with existing resource
    const updatedResource: WithId<Resource> = {
      ...currentResource,
      id,
      field1: formData.field1,
      field2: formData.field2,
      // ... update specific fields from form data
    }

    return yield* repository.update(updatedResource)
  })
}
```

**Key points**:

- Actions take form data and return Effect with proper error types
- Update actions preserve unchanged fields by spreading current resource
- Update actions accept current resource to enable field merging
- Both use typed ResourceFormData from schema

## Hook Pattern

All resources use a collection hook for managing list data with filters.

**Location**: `modules/resources/{Resource}/hooks/use{Resource}Collection.ts`

**Template**: [usePatientCollection.ts](app/modules/resources/Patient/hooks/usePatientCollection.ts)

```typescript
import {
  Resource,
  ResourceId,
  ResourceRepository,
} from '@assessmentis/clinical-domain/...'
import { useClinicalDataCollection } from 'app/modules/common/hooks/useClinicalDataCollection'
import { useResourceRunEffect } from '../../../../clientRuntime'
import { useMemo } from 'react'
import { Effect } from 'effect'

export const useResourceCollection = (filters: object) => {
  const resources = useResourceRunEffect(
    useMemo(() => {
      return Effect.gen(function* () {
        const resourceRepository = yield* ResourceRepository
        return yield* resourceRepository.getMany(filters)
      })
    }, [filters])
  )
  return useClinicalDataCollection<
    ResourceId,
    Resource,
    ResourceRepository,
    typeof ResourceRepository,
    never
  >(ResourceRepository, resources)
}
```

**Key points**:

- Wraps `useClinicalDataCollection` with resource-specific types
- Accepts filters object that's passed to `getMany`
- Returns `{ collection, deleteItem }` for use in list pages
- Uses `useResourceRunEffect` with memoized Effect
- Filter changes trigger data refetch

## Data Loading Patterns

### Effect Framework

This project uses the Effect framework for data fetching and error handling.

**Standard pattern**:

```typescript
const runtime = await getRuntime()
const data = await runtime.runPromise(
  Effect.gen(function* () {
    const repository = yield* ResourceRepository
    return yield* repository.getMany()
  })
)
```

### Repository Pattern

All data access goes through repositories that provide:

- `get(id)` - Fetch single resource
- `getMany(filter?)` - Fetch multiple resources with optional filters
- `create(resource)` - Create new resource
- `createMany(resources)` - Batch create
- `update(resource)` - Update resource
- `delete(id)` - Delete resource

Repositories are located in the domain layer and injected via Effect context.

## CRUD Operations

### useCollection Hook

Location: `@assessmentis/react-util`

**Purpose**: Manage collections with optimistic updates

**Pattern**:

```typescript
const { collection: items, deleteItem, createItem } = useCollection<ItemId, Item>(
  {
    apiDelete: async (id) => runtime.runPromise(...),
    apiCreate: async (item) => runtime.runPromise(...),
  },
  initialItems
)
```

**Features**:

- Optimistic updates (immediate UI feedback)
- Loading states per item
- Automatic rollback on errors

### List Component Pattern

**Template**: [PatientList.tsx](app/modules/patient/components/PatientList.tsx)

```typescript
const ResourceList = ({
  resources,
  deleteResource,
}: {
  resources: { data: Resource; loading: boolean }[]
  deleteResource: (id: ResourceId | undefined) => Promise<void>
}) => {
  return (
    <div>
      <h2 className="heading-3">Resource List</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {resources.map(({ data: resource, loading }, index) => (
          <li
            key={resource.id ?? index}
            style={{
              padding: 'var(--space-3)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              ...(loading ? { opacity: 0.5 } : {}),
            }}
          >
            <button
              className="button-3 ghost"
              onClick={() => deleteResource(resource.id)}
              disabled={loading}
              aria-label="Delete resource"
              style={{ border: 'none' }}
            >
              ❌
            </button>
            <Link
              to={`/Resource/${resource.id}`}
              className="body-3"
              style={{
                flex: 1,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <strong>{resource.displayName}</strong>
              <div
                style={{
                  fontSize: '0.9em',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {resource.secondaryInfo}
              </div>
            </Link>
          </li>
        ))}
        {resources.length === 0 && (
          <li
            className="body-3"
            style={{
              padding: 'var(--space-3)',
              color: 'var(--color-text-secondary)',
            }}
          >
            No resources found.
          </li>
        )}
      </ul>
    </div>
  )
}
```

## Styling Conventions

### Design Tokens

**Spacing**: Use `var(--space-*)` tokens

- `--space-1` through `--space-10` (increasing sizes)
- Common: `--space-3` (gaps), `--space-4` (section spacing), `--space-5` (larger sections), `--space-7` (page sections)

**Colors**: Use `var(--color-*)` tokens

- `--color-text-primary` - Main text color
- `--color-text-secondary` - Secondary text
- `--color-border` - Border color
- `--color-background` - Background color

**Borders**: Use `var(--radius-*)` for rounded corners

### Typography Classes

- `heading-1` - Page titles
- `heading-3` - Section headings
- `subheading-3` - Subtitles, IDs
- `body-3` - Body text

### Button Classes

- `button-2 blue` - Primary action buttons
- `button-3 ghost` - Secondary/tertiary buttons (back links, delete)

### Layout Patterns

**Section spacing**:

```typescript
<section style={{ marginTop: 'var(--space-5)' }}>
  <h2 className="heading-3">Section Title</h2>
  {/* Content */}
</section>
```

**Key-value grid**:

```typescript
<div
  style={{
    display: 'grid',
    gridTemplateColumns: '200px 1fr',
    gap: 'var(--space-3)',
  }}
>
  <span className="body-3">Label:</span>
  <span className="body-3">{value}</span>
</div>
```

**Filter grid**:

```typescript
<div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-3)',
  }}
>
  <Picker1 />
  <Picker2 />
</div>
```

## Reference Patterns (FHIR)

### Handling FHIR References

FHIR references use the format: `"ResourceType/id"`

**Structure**:

```typescript
{
  reference?: string      // "Patient/123"
  display?: string        // Human-readable text
  type?: string          // Resource type
  identifier?: Identifier
}
```

**Extracting IDs**:

```typescript
const patientId = observation.subject?.reference?.split('/')[1]
```

**Creating links**:

```typescript
{resource.subject?.reference && (
  <Link to={`/${resource.subject.reference}`}>
    {resource.subject.display || resource.subject.reference}
  </Link>
)}
```

**Filtering by reference**:

```typescript
// Server-side
const filter: any = {}
if (patientId) filter.subject = `Patient/${patientId}`

// Client-side
if (
  selectedPatientId &&
  obs.subject?.reference !== `Patient/${selectedPatientId}`
) {
  return false
}
```

## Common Edge Cases

### Empty States

Always provide empty state messages:

```typescript
{items.length === 0 && (
  <p className="body-3" style={{ color: 'var(--color-text-secondary)' }}>
    No items found.
  </p>
)}
```

### Missing References

Check for undefined before accessing:

```typescript
const displayName = resource.subject?.display || 'No subject linked'
```

### Polymorphic Fields

Check which variant is present:

```typescript
function getValue(observation: Observation) {
  if ('valueString' in observation) return observation.valueString
  if ('valueInteger' in observation) return observation.valueInteger
  // ... check other types
  return 'No value'
}
```

### Loading States

Use opacity for loading items:

```typescript
style={{
  ...(loading ? { opacity: 0.5 } : {})
}}
```

### Invalid IDs

Use Schema.decodeOption for validation:

```typescript
const resourceIdMaybe = Schema.decodeOption(ResourceId)(params.resourceId)

const resourceId =
  yield *
  resourceIdMaybe.pipe(
    Option.map(Effect.succeed),
    Option.getOrElse(() =>
      Effect.fail(new UnhandledError({ cause: 'Resource ID not found' }))
    )
  )
```

## Best Practices

1. **Consistency**: Follow existing patterns from Patient/Practitioner pages
2. **Type Safety**: Use Effect Schema for validation and type inference
3. **Accessibility**: Include `aria-label` attributes on buttons
4. **Performance**: Use server-side filtering for large datasets
5. **User Experience**: Provide loading states and empty states
6. **Error Handling**: Use Effect framework for proper error propagation
7. **Naming**: Follow resource-based naming (Patient, Observation, not Patients, Observations)
8. **URLs**: Use resource references in URLs for shareability

## Example: Creating a Complete Resource CRUD Implementation

Follow these steps to implement full CRUD for a new resource:

### 1. Create Form Schema

`modules/resources/{Resource}/schemas/{Resource}FormSchema.ts`:

```typescript
import { Schema } from 'effect'

export const ResourceFormSchema = Schema.Struct({
  field1: Schema.optional(Schema.String),
  field2: Schema.optional(Schema.DateTimeUtc),
  // ... all editable fields
})

export type ResourceFormData = typeof ResourceFormSchema.Type
```

### 2. Create Form Component

`modules/resources/{Resource}/components/{Resource}Form.tsx`:

Use the extracted form pattern with ResourceForm, defining all fields and their order.

### 3. Create Actions

- `modules/resources/{Resource}/actions/create{Resource}.ts`
- `modules/resources/{Resource}/actions/update{Resource}.ts`

Use the action pattern templates shown above.

### 4. Create Collection Hook

`modules/resources/{Resource}/hooks/use{Resource}Collection.ts`:

Use the hook pattern template shown above.

### 5. Create List Component

`modules/resources/{Resource}/components/{Resource}List.tsx`:

Standard list component with delete functionality.

### 6. Create Routes

Create all four route files:

- `routes/_resource.{Resource}._index.tsx` - List page with link to create
- `routes/_resource.{Resource}.new.tsx` - Create page
- `routes/_resource.{Resource}.$resourceId._index.tsx` - Detail page with edit link
- `routes/_resource.{Resource}.$resourceId.edit.tsx` - Edit page

Use the page pattern templates shown above.

### 7. Optional: Create Picker

If the resource needs to be selected in other forms:

`modules/resources/{Resource}/components/{Resource}Picker.tsx`:

Use the picker pattern and export in `BasePicker/index.ts`.

### Complete Reference Implementations

- **Patient**: Full CRUD with all patterns implemented
  - [List](app/routes/_resource.Patient._index.tsx)
  - [Detail](app/routes/_resource.Patient.$patientId._index.tsx)
  - [Create](app/routes/_resource.Patient.new.tsx)
  - [Edit](app/routes/_resource.Patient.$patientId.edit.tsx)
  - [Form](app/modules/resources/Patient/components/PatientForm.tsx)
  - [Actions](app/modules/resources/Patient/actions/)
  - [Hook](app/modules/resources/Patient/hooks/usePatientCollection.ts)

- **Practitioner**: Simpler CRUD (no pickers in form)
- **Encounter**: Custom form with multiple pickers
- **Composition**: Standard CRUD with date fields
- **Observation**: Minimal CRUD implementation
