# Frontend Design Conventions

This document establishes design conventions and best practices for the AssessmentIS frontend application. It serves as a reference for maintaining consistency across the codebase and guiding future development.

## Design System Principles

### Visual Density

**Standard**: Comfortable spacing (balanced density)

**Rationale**: Provides good readability without wasting space. Strikes a balance between information density and visual comfort.

**Implementation**:
- Use `var(--space-4)` for section gaps
- Use `var(--space-3)` for component gaps
- Use `var(--space-5)` to `var(--space-6)` for separating major page sections

### Typography Hierarchy

Use Tundra CSS typography classes consistently:

**IMPORTANT**: In Tundra, `heading-6` is the largest and `heading-1` is the smallest.

- **Page Titles**: `heading-6` class (largest)
- **Section Headings**: `heading-4` class
- **Subsection Headings**: `heading-3` class
- **Subtitles/Metadata**: `text-alt-heading-3` class
- **Body Text**: `body-3` class
- **Form Labels**: `label-3` class

**Example**:
```tsx
<h1 className="heading-6">Patients</h1>
<h2 className="heading-4">Demographics</h2>
<h3 className="heading-3">Subsection</h3>
<p className="text-alt-heading-3">Patient ID: {id}</p>
<span className="body-3">Content text</span>
<label className="label-3">Field Name</label>
```

### Color Usage

**Text Colors**:
- **Primary Text**: Default (inherits from Tundra)
- **Secondary Text**: `var(--color-text-secondary)` or `var(--neutral-6)`
- **Error Text**: `var(--red-8)`

**UI Colors**:
- **Borders**: `var(--color-border)` or `var(--neutral-8)`
- **Backgrounds**: `var(--color-background)` or `var(--neutral-1)`
- **Destructive Actions**: `var(--red-6)` for text, `var(--red-8)` for backgrounds
- **Error States**: `var(--red-6)` for borders, `var(--red-1)` for backgrounds

**Prefer semantic variable names** over specific color scale values when available.

### Spacing Scale

Tundra provides `--space-1` through `--space-10`:

- **Component padding**: `var(--space-3)` to `var(--space-4)`
- **Section margins**: `var(--space-5)` to `var(--space-6)`
- **Large gaps**: `var(--space-7)` to `var(--space-8)`
- **Extra large gaps**: `var(--space-9)` to `var(--space-10)`

## Component Patterns

### List Pages

**Layout**: Vertical stack with header, actions, and list

**Structure**:
1. Page title (`heading-1`)
2. Create action button (`button-2 blue`)
3. List of items with border separators

**Empty State**: Helpful text with primary action

**Example**:
```tsx
<h1 className="heading-1">Patients</h1>
<Link to="/Patient/new" className="button-2 blue">
  Create New Patient
</Link>
{items.length === 0 ? (
  <p className="body-3">No patients found. Create your first patient to get started.</p>
) : (
  <ul>{items.map(...)}</ul>
)}
```

**Item Style**:
- Bordered rows with subtle separators
- Left-aligned content
- Metadata as secondary text
- Actions in a dropdown menu (View, Edit, Delete) using Headless UI

**See**: [_resource.Patient._index.tsx](apps/frontend/app/routes/_resource.Patient._index.tsx)

### Detail Pages

**Layout**: Actions top-left, then title, then sectioned content

**Structure**:
1. Actions bar (back button - NO inline edit actions)
2. Page title with optional subtitle
3. Sections separated by headings
4. Debug data (development only via shouldShowRawData helper)

**IMPORTANT**: Detail pages should not allow inline editing. Always link to a separate edit page.

**Sections**: Use `heading-3` for section titles, separated by `margin-top`

**Actions**:
- Back button: `button-3 ghost`
- Edit button: `button-2 blue`

**Debug Data**: Use `shouldShowRawData(data)` helper function instead of `import.meta.env.DEV`

**Example**:
```tsx
<DetailPageActions backTo="/Patient" editTo={`/Patient/${id}/edit`} />
<h1 className="heading-6">{displayName}</h1>
<p className="text-alt-heading-3">Patient ID: {id}</p>

<section>
  <h2 className="heading-4">Demographics</h2>
  <DetailGrid items={demographics} />
</section>

{shouldShowRawData(data) ? (
  <details>
    <summary className="heading-4">Raw Data</summary>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </details>
) : undefined}
```

**See**: Patient detail page implementation

### Forms

**Layout**: Vertical stack, max-width 600px

**Structure**:
1. Page title
2. Form fields (full-width with labels above inputs)
3. Submit button at bottom

**Fields**: Full-width with labels above inputs

**Submit**: Primary button (`button-2 blue`) at bottom of form

**Errors**: Red background panel at top with list of errors

**Example**:
```tsx
<h1 className="heading-6">Create Patient</h1>
<form>
  <label className="label-3">Given Name</label>
  <input className="input-2" type="text" />

  <button type="submit" className="button-2 blue">
    Create Patient
  </button>
</form>
```

**See**: [PatientForm.tsx](apps/frontend/app/modules/resources/Patient/components/PatientForm.tsx)

### Buttons

**Standard Combinations**:

- **Primary Actions**: `button-2 blue` (Create, Save, Submit)
- **Secondary Actions**: `button-3 ghost` (Back, Cancel)
- **Destructive Actions**: `button-2 red` (Delete - when standalone)
- **Inline Destructive**: `button-3 ghost` with red text (Delete in lists)

**Examples**:
```tsx
{/* Primary action */}
<Link to="/Patient/new" className="button-2 blue">Create New Patient</Link>

{/* Secondary action */}
<Link to="/Patient" className="button-3 ghost">← Back</Link>

{/* Destructive action */}
<button className="button-2 red" onClick={handleDelete}>Delete Patient</button>

{/* Inline delete (in lists) */}
<button className="button-3 ghost" onClick={handleDelete}>×</button>
```

### Empty States

**Approach**: Helpful text with actions

**Structure**:
1. Clear explanation of why empty
2. Primary button to create first item

**Example**:
```tsx
<p className="body-3">
  No patients found. Create your first patient to get started.
</p>
<Link to="/Patient/new" className="button-2 blue">
  Create New Patient
</Link>
```

## Loading States

### Philosophy

Avoid obtrusive loading indicators. Use subtle visual feedback that doesn't interrupt the user experience.

### Skeleton Loading

**When**: Initial data fetch for lists and detail pages

**Approach**: Use `react-loading-skeleton` to show placeholder UI with the exact same shape as the content

**IMPORTANT**: Do NOT use `<PageLoader />` for component pages. Use skeleton items instead so users know what to expect.

**Example - List Page**:
```tsx
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

{LoadedResult.handle(collection, {
  onLoading: () => (
    <ul>
      {[...Array(5)].map((_, i) => (
        <li key={i} className={classes.ListPage__item}>
          <Skeleton width={40} height={20} />
          <div style={{ flex: 1 }}>
            <Skeleton width="60%" height={20} />
            <Skeleton width="80%" height={16} style={{ marginTop: 4 }} />
          </div>
        </li>
      ))}
    </ul>
  ),
  onSuccess: (data) => <PatientList patients={data} />
})}
```

**Example - Detail Page**:
```tsx
{loadedData._tag === 'loading' ? (
  <div>
    <Skeleton width={200} height={40} />
    <Skeleton width="100%" height={20} count={3} style={{ marginTop: 16 }} />
  </div>
) : (
  <ResourceDetailPage {...props} />
)}
```

### List Item Loading

**When**: Optimistic updates, deletes, or mutations on specific items

**Approach**:
- Reduce opacity to 50%
- Disable interactive elements
- **NO per-item spinners**

**Example**:
```tsx
<li className={loading ? classes['ListItem--loading'] : ''}>
  <span>{patient.name}</span>
  <button disabled={loading} onClick={handleDelete}>Delete</button>
</li>
```

**CSS**:
```css
.ListItem--loading {
  opacity: 0.5;
  pointer-events: none;
}
```

### Form Loading

**When**: Form submission in progress

**Approach**:
- Disable all inputs and buttons
- Change button text to "Saving..." (no spinner)
- Optionally reduce form opacity

**Example**:
```tsx
<input disabled={loading} />
<button type="submit" disabled={loading} className="button-2 blue">
  {loading ? 'Saving...' : 'Save Patient'}
</button>
```

### Tombstoning

**When**: Subsequent data loads (refreshing already-loaded data)

**Approach**:
- Show previous data with reduced opacity
- Disable interactions
- Smooth transition when new data arrives

**Example**:
```tsx
<div className={refreshing ? classes['Content--refreshing'] : ''}>
  {/* Previous data still visible */}
</div>
```

## Tundra CSS Usage Patterns

### Typography Classes

**Always use Tundra classes, never inline font styles**:

**REMEMBER**: `heading-6` is largest, `heading-1` is smallest

- `heading-6` - Page titles (largest)
- `heading-4`, `heading-3` - Section headings
- `text-alt-heading-3` - Metadata and subtitles (NOT `subheading-*`)
- `body-3` - Body text
- `label-3` - Form labels

### Button Classes

**Standard combinations**:
- `button-2 blue` - Primary actions
- `button-2 red` - Destructive primary actions
- `button-3 ghost` - Secondary actions
- `button-1` - Large emphasis buttons (rare)

**Element base**: Use `element-button` when you need the base button styling without text classes

### Input Classes

- `input-2` - Standard text inputs, textareas, selects
- `input-3` - Smaller inputs (if needed)
- `radio-3 blue` - Radio buttons with blue accent
- `checkbox-*` - Checkbox inputs

### Layout Utilities

**Avoid inline flexbox/grid styles**. Create CSS module classes for complex layouts instead.

### Color Variables

**Prefer semantic names**:
```css
/* ✅ Good - semantic */
.DetailPage__subtitle {
  color: var(--color-text-secondary);
}

/* ❌ Bad - specific scale */
.DetailPage__subtitle {
  color: var(--neutral-6);
}
```

**Common semantic variables** (when available):
- `var(--color-text-primary)` - Default text
- `var(--color-text-secondary)` - Muted text
- `var(--color-background)` - Background color
- `var(--color-background-secondary)` - Alternate background
- `var(--color-border)` - Border color
- `var(--color-error)` - Error state color

**Fallback to scale** when semantic names don't exist:
- Text: `var(--neutral-6)` for secondary
- Borders: `var(--neutral-8)`
- Backgrounds: `var(--neutral-9)` for subtle

## CSS Module Guidelines

### When to Create CSS Modules

1. **Complex component layouts** (grid, flexbox with multiple properties)
2. **Component-specific state styles** (hover, active, disabled)
3. **Responsive patterns**
4. **Reusable component variants**

### When to Use Inline Styles

**NEVER** - Inline styles should be eliminated in favor of:
1. Tundra utility classes
2. CSS module classes
3. Composition of both using `cn()`

### CSS Module Naming

**File naming**: `ComponentName.module.css`

**Class naming** (BEM convention):
- Root class: `.ComponentName`
- Child elements: `.ComponentName__element`
- Modifiers: `.ComponentName--modifier`
- States: `.ComponentName__element--state`

**Example**:
```css
.ResourceDetail {
  padding: var(--space-6);
}

.ResourceDetail__section {
  margin-top: var(--space-5);
}

.ResourceDetail__grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--space-3);
}

.ResourceDetail__metadata {
  color: var(--color-text-secondary);
}

.ResourceDetail__section--hidden {
  display: none;
}
```

### Example Module Structure

```css
/* PatientList.module.css */
.PatientList {
  /* Container styles */
}

.PatientList__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.PatientList__item:hover {
  background-color: var(--neutral-9);
}

.PatientList__item--loading {
  opacity: 0.5;
  pointer-events: none;
}

.PatientList__deleteButton {
  border: none;
  background: transparent;
  cursor: pointer;
}

.PatientList__deleteButton:hover {
  color: var(--red-6);
}
```

### Combining Tundra Classes with CSS Modules

Use the `cn()` utility to combine classes:

```tsx
import { cn } from '@assessmentis/react-util'
import classes from './PatientList.module.css'

<div className={cn('body-3', classes.PatientList__content)}>
  {/* Tundra typography + custom layout */}
</div>
```

## JSX Patterns

### Conditional Rendering

**IMPORTANT**: Prefer explicit ternaries over `&&` operator for conditional JSX.

```tsx
// ✅ Good - explicit ternary
{condition ? <Component /> : undefined}

// ✅ Good - with else case
{condition ? <ComponentA /> : <ComponentB />}

// ❌ Bad - avoid &&
{condition && <Component />}
```

**Rationale**: Explicit ternaries make the intent clear and avoid potential issues with falsy values (0, '', etc.) being rendered.

### Component vs Function

**IMPORTANT**: Functions that return JSX should be components, not utility functions.

```tsx
// ❌ Bad - JSX-returning function in utils
// In utils/patientDisplay.ts
export function formatPatientContact(patient: Patient): ReactNode {
  return <ul>{/* JSX */}</ul>
}

// ✅ Good - Component in components directory
// In components/PatientContactInfo.tsx
export function PatientContactInfo({ patient }: { patient: Patient }) {
  return <ul>{/* JSX */}</ul>
}
```

**Rationale**: Components belong in the component directory, can use hooks, and follow React conventions.

## Environment-Based Features

### Debug Data Display

**IMPORTANT**: Use `shouldShowRawData(data)` helper function instead of `import.meta.env.DEV` directly.

```tsx
// ✅ Good - use helper
{shouldShowRawData(data) ? (
  <details>
    <summary className="heading-4">Raw Data</summary>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </details>
) : undefined}

// ❌ Bad - direct env check with &&
{import.meta.env.DEV && (
  <details>
    <summary className="heading-3">Raw Data</summary>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </details>
)}
```

### Development-Only Controls

Use `shouldShowRawData` or direct `import.meta.env.DEV` checks for features not intended for production:

```tsx
{import.meta.env.DEV && (
  <button onClick={resetDatabase}>Reset Database</button>
)}
```

## Accessibility Guidelines

### Semantic HTML

Use appropriate semantic elements:

- `<section>` for logical content sections
- `<article>` for self-contained content
- `<dl>`, `<dt>`, `<dd>` for key-value data
- `<details>` and `<summary>` for collapsible content
- `<nav>` for navigation areas
- `<main>` for main content area

**Example**:
```tsx
<main>
  <nav>
    <Link to="/">Home</Link>
  </nav>

  <section>
    <h2 className="heading-3">Demographics</h2>
    <dl>
      <dt>Name</dt>
      <dd>{name}</dd>
    </dl>
  </section>
</main>
```

### ARIA Labels

- Add `aria-label` to icon-only buttons
- Add `aria-disabled` where appropriate
- Ensure form inputs have associated labels (via `<label>` or `aria-label`)

**Example**:
```tsx
<button aria-label="Delete patient" onClick={handleDelete}>
  ×
</button>

<label htmlFor="givenName" className="label-3">Given Name</label>
<input id="givenName" className="input-2" type="text" />
```

## File Organization

### Route Files

**Should contain**: Minimal orchestration logic only
- Data loading (`clientLoader`)
- Hook calls
- Component composition
- Navigation

**Should NOT contain**:
- Inline styles (use CSS modules)
- Complex rendering logic (extract to components)
- Data transformation logic (extract to utilities)
- Style definitions

**Example**:
```tsx
// ✅ Good
export default function PatientPage() {
  const { collection, deleteItem } = usePatientCollection({})
  return <PatientList patients={collection} onDelete={deleteItem} />
}

// ❌ Bad
export default function PatientPage() {
  const { collection } = usePatientCollection({})
  const displayName = patient.name?.[0]
    ? `${patient.name[0].given?.join(' ')} ${patient.name[0].family}`.trim()
    : 'Unnamed'

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {/* Lots of inline JSX */}
    </div>
  )
}
```

### Resource Modules

**Directory structure**:
```
modules/resources/Patient/
  actions/
    createPatient.ts
    updatePatient.ts
  components/
    PatientForm.tsx
    PatientList.tsx
    PatientListItem/
      PatientListItem.tsx
      PatientListItem.module.css
  hooks/
    usePatientCollection.ts
  schemas/
    PatientFormSchema.ts
  utils/
    patientDisplay.ts
```

### Common Components

**Directory structure**:
```
modules/common/components/
  ResourceListPage/
    ResourceListPage.tsx
    ResourceListPage.module.css
  ResourceDetailPage/
    ResourceDetailPage.tsx
    ResourceDetailPage.module.css
  DetailGrid/
    DetailGrid.tsx
    DetailGrid.module.css
```

## Examples

### List Page Example

See: [apps/frontend/app/routes/_resource.Patient._index.tsx](apps/frontend/app/routes/_resource.Patient._index.tsx)

### Detail Page Example

See: Patient detail page implementation

### Form Page Example

See: [apps/frontend/app/routes/_resource.Patient.new.tsx](apps/frontend/app/routes/_resource.Patient.new.tsx)

### Resource Form Example

See: [apps/frontend/app/modules/common/components/ResourceForm/ResourceForm.tsx](apps/frontend/app/modules/common/components/ResourceForm/ResourceForm.tsx)

## Common Patterns

### Display Name Generation

Extract display logic to utility functions:

```tsx
// ✅ Good - in utils/patientDisplay.ts
export function getPatientDisplayName(patient: Patient): string {
  const name = patient.name?.[0]
  if (!name) return 'Unnamed Patient'

  const given = name.given?.join(' ') ?? ''
  const family = name.family ?? ''
  return `${given} ${family}`.trim()
}

// Use in components
import { getPatientDisplayName } from '../utils/patientDisplay'
const displayName = getPatientDisplayName(patient)
```

### Section Data Formatting

Create utility functions that return data structures for display components:

```tsx
// In utils/patientDisplay.ts
export function formatPatientDemographics(patient: Patient) {
  return [
    { label: 'Gender', value: patient.gender },
    { label: 'Birth Date', value: patient.birthDate },
    { label: 'Active', value: patient.active ? 'Yes' : 'No' },
  ]
}

// Use with DetailGrid
<DetailGrid items={formatPatientDemographics(patient)} />
```

### Error Handling

Use consistent error display patterns:

```tsx
{LoadedResult.handle(data, {
  onLoading: () => <PageLoader message="Loading..." />,
  onError: (error) => (
    <p className={cn('body-3', classes.ErrorMessage)}>
      Error: {String(error)}
    </p>
  ),
  onSuccess: (data) => <Content data={data} />
})}
```

## Anti-Patterns to Avoid

### ❌ Inline Styles

```tsx
// ❌ Bad
<div style={{ display: 'flex', gap: 'var(--space-3)' }}>

// ✅ Good
<div className={classes.FlexContainer}>
```

### ❌ Logic in Route Files

```tsx
// ❌ Bad - transformation logic in route
export default function PatientDetail({ loaderData }) {
  const displayName = patient.name?.[0]
    ? `${patient.name[0].given?.join(' ')} ${patient.name[0].family}`.trim()
    : 'Unnamed'
  // ...
}

// ✅ Good - logic in utility file
import { getPatientDisplayName } from '../utils/patientDisplay'

export default function PatientDetail({ loaderData }) {
  const displayName = getPatientDisplayName(patient)
  // ...
}
```

### ❌ Hardcoded Colors

```tsx
// ❌ Bad
<span style={{ color: '#888' }}>

// ✅ Good
<span style={{ color: 'var(--color-text-secondary)' }}>
```

### ❌ Inconsistent Typography

```tsx
// ❌ Bad
<h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>

// ✅ Good
<h1 className="heading-1">
```

## Migration Notes

When refactoring existing pages:

1. **Start with route file**: Identify inline styles and complex logic
2. **Extract utilities**: Move display/transform logic to utility files
3. **Create CSS modules**: Move inline styles to CSS modules
4. **Use base components**: Replace custom layouts with ResourceListPage/ResourceDetailPage
5. **Validate**: Ensure functionality remains identical

## Questions?

For questions or clarifications about these conventions, refer to the implementation in the Patient resource pages as the canonical example.
