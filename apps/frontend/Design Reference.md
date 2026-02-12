# Design Reference

Design system lookup tables and page structure conventions. For full CRUD implementation, see [Resource CRUD Reference](./app/modules/resources/Resource%20CRUD%20Reference.md).

## Typography

Tundra CSS typography classes. **heading-6 is largest, heading-1 is smallest.**

| Use                  | Class                |
| -------------------- | -------------------- |
| Page titles          | `heading-6`          |
| Section headings     | `heading-4`          |
| Subsection headings  | `heading-3`          |
| Subtitles / metadata | `text-alt-heading-3` |
| Body text            | `body-3`             |
| Form labels          | `label-3`            |

## Buttons

| Use                             | Class                          |
| ------------------------------- | ------------------------------ |
| Primary action (Create, Save)   | `button-2 blue`                |
| Secondary action (Back, Cancel) | `button-3 ghost`               |
| Destructive standalone (Delete) | `button-2 red`                 |
| Destructive inline (in lists)   | `button-3 ghost` with red text |
| Large emphasis (rare)           | `button-1`                     |
| Base styling only               | `element-button`               |

## Inputs

| Use                             | Class          |
| ------------------------------- | -------------- |
| Text inputs, textareas, selects | `input-2`      |
| Smaller inputs                  | `input-3`      |
| Radio buttons                   | `radio-3 blue` |
| Checkboxes                      | `checkbox-*`   |

## Spacing

Tundra provides `--space-1` through `--space-10`:

| Use                      | Token                                |
| ------------------------ | ------------------------------------ |
| Component gaps           | `var(--space-3)`                     |
| Section gaps             | `var(--space-4)`                     |
| Major section separation | `var(--space-5)` to `var(--space-6)` |
| Large gaps               | `var(--space-7)` to `var(--space-8)` |

## Colors

Prefer semantic names over scale values:

| Use            | Semantic                      | Fallback                                 |
| -------------- | ----------------------------- | ---------------------------------------- |
| Primary text   | default (inherits)            | —                                        |
| Secondary text | `var(--color-text-secondary)` | `var(--neutral-6)`                       |
| Error text     | `var(--color-error)`          | `var(--red-8)`                           |
| Borders        | `var(--color-border)`         | `var(--neutral-8)`                       |
| Backgrounds    | `var(--color-background)`     | `var(--neutral-1)`                       |
| Destructive    | —                             | `var(--red-6)` text, `var(--red-8)` bg   |
| Error state    | —                             | `var(--red-6)` border, `var(--red-1)` bg |

## CSS Module Naming

BEM convention. File naming: `ComponentName.module.css`

```css
.ComponentName {
}
.ComponentName__element {
}
.ComponentName--modifier {
}
.ComponentName__element--state {
}
```

Combine Tundra + modules with `cn()`:

```tsx
import { cn } from '@assessmentis/react-util'
import classes from './PatientList.module.css'

<div className={cn('body-3', classes.PatientList__content)}>
```

- **Tundra classes**: typography, buttons, inputs, simple spacing
- **CSS Modules**: complex layouts, component states, responsive patterns

## Page Structures

### List Page

Title → create button → list with border separators → empty state.

```tsx
<h1 className="heading-6">Patients</h1>
<Link to="/Patient/new" className="button-2 blue">Create New Patient</Link>
{LoadedResult.handle(collection, {
  onLoading: () => <SkeletonList count={5} />,
  onSuccess: (data) => <PatientList patients={data} />,
})}
```

Use `react-loading-skeleton` for loading, never `<PageLoader />` on data pages.

### Detail Page

Back/edit actions → title → sections → debug data (dev only). No inline editing — link to edit page.

```tsx
<DetailPageActions backTo="/Patient" editTo={`/Patient/${id}/edit`} />
<PageHeader title={displayName} subtitle={`Patient ID: ${id}`} />
<section>
  <h2 className="heading-4">Demographics</h2>
  <DetailGrid items={demographics} />
</section>
```

### Form Page

Title → fields (full-width, labels above) → submit. Max-width 600px. Errors as red panel at top.

```tsx
<FormPage title="Create Patient">
  <PatientForm onSubmit={handleSubmit} submitLabel="Create Patient" />
</FormPage>
```

## Loading States

| Situation              | Approach                                      |
| ---------------------- | --------------------------------------------- |
| Initial data fetch     | Skeleton loading (same shape as content)      |
| Item mutation          | 50% opacity, disable interactions, no spinner |
| Form submission        | Disable inputs, button text → "Saving..."     |
| Refreshing loaded data | Previous data at reduced opacity              |

## See Also

- [Resource CRUD Reference](./app/modules/resources/Resource%20CRUD%20Reference.md) — Full CRUD implementation reference
