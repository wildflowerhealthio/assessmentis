# Frontend Patterns and Conventions

This document outlines the frontend patterns and conventions used in this project to ensure consistency and make implementing new features more efficient.

## File Structure and Naming Conventions

### Routes

Location: `/apps/frontend/app/routes/`

Naming pattern:

- **List pages**: `ResourceName._index.tsx` (e.g., `Patient._index.tsx`, `Practitioner._index.tsx`)
- **Detail pages**: `ResourceName.$paramName.tsx` (e.g., `Patient.$patientId.tsx`, `Observation.$observationId.tsx`)

The framework uses file-based routing with React Router v7, and route types are auto-generated in `.react-router/types/`.

### Modules

Location: `/apps/frontend/app/modules/{module-name}/`

Structure:

```
modules/
  {resource-name}/           (e.g., patient, practitioner, observation)
    components/
      {ResourceName}List.tsx
      {ResourceName}Picker/
        {ResourceName}Picker.tsx
    schemas/
      {ResourceName}FormSchema.ts
      {ResourceName}FormSchema.test.ts
```

The modules do not strictly map to resources, but instead focuses on repeatable units of UI, functions, and Effects

## Page Patterns

### List Pages

**Purpose**: Display a list of resources with create/delete functionality

**Template**: [Patient.\_index.tsx](app/routes/Patient._index.tsx)

**Standard structure**:

```typescript
export async function clientLoader(_: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const resources = await runtime.runPromise(
    Effect.gen(function* () {
      const repository = yield* ResourceRepository
      return yield* repository.getMany()
    })
  )
  return { resources }
}

const useResources = (initial: Resource[]) => {
  const clientRuntime = useRuntimeContext()

  return useCollection<ResourceId, Resource>(
    {
      apiDelete: async (id: ResourceId) =>
        clientRuntime.runPromise(
          Effect.all([
            Effect.sleep('200 millis'),
            ResourceRepository.pipe(Effect.flatMap((r) => r.delete(id))),
          ])
        ),
      apiCreate: async (resource: Resource) =>
        clientRuntime.runPromise(
          Effect.all([
            Effect.sleep('200 millis'),
            ResourceRepository.pipe(Effect.flatMap((r) => r.create(resource))),
          ]).pipe(Effect.map(([, x]) => x))
        ),
    },
    initial
  )
}

export default function ResourcePage({ loaderData }: Route.ComponentProps) {
  const { resources: initialResources } = loaderData
  const { collection: resources, deleteItem: deleteResource } =
    useResources(initialResources)

  return (
    <>
      <h1 className="heading-1">Resources</h1>

      <ResourceList
        resources={resources}
        deleteResource={deleteResource}
      />

      <h2 className="heading-3" style={{ marginTop: 'var(--space-7)' }}>
        Create a new resource
      </h2>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <ResourceForm ... />
      </div>
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

**Purpose**: Display comprehensive details of a single resource

**Template**: [Patient.$patientId.tsx](app/routes/Patient.$patientId.tsx)

**Standard structure**:

```typescript
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const resourceIdMaybe = tryDecodeResourceId(params.resourceId)

  const resource = await runtime.runPromise(
    Effect.gen(function* () {
      const repository = yield* ResourceRepository

      const resourceId = yield* resourceIdMaybe.pipe(
        Option.map(Effect.succeed),
        Option.getOrElse(() =>
          Effect.fail(new UnhandledError({ cause: 'Resource ID not found' }))
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
      <Link to="/Resource" className="button-3 ghost">← Back to Resources</Link>

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

## Example: Creating a Complete Resource Page

1. Create picker: `modules/{resource}/components/{Resource}Picker/{Resource}Picker.tsx`
2. Create list component: `modules/{resource}/components/{Resource}List.tsx`
3. Create list page: `routes/{Resource}._index.tsx`
4. Create detail page: `routes/{Resource}.$resourceId.tsx`
5. Export picker in `BasePicker/index.ts`
6. Test with various edge cases

See [Patient.\_index.tsx](app/routes/Patient._index.tsx) and [Patient.$patientId.tsx](app/routes/Patient.$patientId.tsx) for complete examples.
