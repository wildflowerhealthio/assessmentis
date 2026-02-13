# Resource CRUD Reference

Reference for frontend Clinical Resource CRUD conventions in `apps/frontend/app/modules/resources`.

For cross-layer onboarding, see [Adding Clinical Resource Types How-To](./Adding%20Clinical%20Resource%20Types%20How-To.md).

## Standard module layout

Typical structure for `app/modules/resources/{ResourceName}/`:

```plaintext
modules/resources/{ResourceName}/
  actions/
    create{ResourceName}.ts
    update{ResourceName}.ts
  components/
    {ResourceName}Form.tsx
    {ResourceName}ListItem/
      {ResourceName}ListItem.tsx
      {ResourceName}ListItem.module.css
  hooks/
    use{ResourceName}Collection.ts
  schemas/
    {ResourceName}FormSchema.ts
    {ResourceName}FormSchema.test.ts
  utils/
    {resourceName}Display.ts
```

## Route file pattern

| File                            | Purpose     |
| ------------------------------- | ----------- |
| `{ResourceName}._index.tsx`     | List page   |
| `{ResourceName}.new.tsx`        | Create page |
| `{ResourceName}.$id._index.tsx` | Detail page |
| `{ResourceName}.$id.edit.tsx`   | Edit page   |

Examples: `Patient._index.tsx`, `Patient.new.tsx`.

## Repository access pattern

All resource modules consume repositories through `ClinicalDataRepositoryService`.

Common operations used by actions/hooks:

- `get`
- `getMany`
- `create`
- `createMany`
- `update`
- `delete`

## Form schema pattern

Form schemas use Effect Schema and export a `Type` alias:

- `{ResourceName}FormSchema`
- `{ResourceName}FormData`

Schemas are validated in form components and tested with `*.test.ts` files colocated under `schemas/`.

## Action conventions

- `create{ResourceName}.ts`: map validated form data to FHIR shape, call `repository.create`
- `update{ResourceName}.ts`: merge current persisted resource with form updates, call `repository.update`
- Preserve existing resource fields not represented in the form

## Collection hook conventions

- Use shared collection utilities from `app/modules/common`
- Return loaded collection + delete behavior for list pages
- Keep filtering typed to the resource schema where possible

## UI conventions

- Keep route modules thin
- Move business/data logic to actions/hooks
- Use list-item components per resource for consistent rendering and navigation
- Use resource-specific display helpers from `utils/`

## Date/time and reference conventions

| Data shape             | Convention                                                  |
| ---------------------- | ----------------------------------------------------------- |
| Date-only values       | Store as timeless date strings (`YYYY-MM-DD`)               |
| Instant/timestamp data | Use `DateTime.Utc` in schemas and map to UI display helpers |
| FHIR references        | Use `ResourceType/id` format                                |

## Reference implementations

- Patient module: [Patient](./Patient)
- Encounter module: [Encounter](./Encounter)
- Observation module: [Observation](./Observation)

## Related references

- [Design Reference](../../../Design%20Reference.md)
- [Platform Services Reference](../../layers/Platform%20Services%20Reference.md)
- [React Router Data APIs Reference](../../routes/React%20Router%20Data%20APIs%20Reference.md)
