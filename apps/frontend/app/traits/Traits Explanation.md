# Traits Explanation

This document explains the trait pattern used to attach frontend behavior to pure domain classes without modifying the domain package.

## The Problem

Domain classes in `@assessmentis/clinical-domain` model FHIR resources. They must stay **pure** — no UI concerns, no display logic, no framework dependencies. But the frontend needs domain instances to carry UI behavior: a `Location` needs a display name for a picker, a `Patient` needs a formatted label.

The question: how do you add frontend-specific behavior to domain classes without polluting the domain?

## The Solution: Retroactive Interface Implementation

The traits pattern borrows from languages like Rust (traits) and Swift (protocol extensions). It lets you declare "class X now implements interface Y" **from outside the class definition**, using two TypeScript mechanisms working together:

1. **Module augmentation** (`declare module`) — extends the type at compile time
2. **`Object.defineProperty`** — extends the class at runtime

### Anatomy of a Trait

A trait has three parts:

**The interface** defines what instances and classes must provide. For example, `PickerItem` defines:

- An **instance property** (`PickerItem: { id, display, secondary }`) — what each instance contributes
- A **class property** (`PickerItem: { Placeholder, Label }`) — static metadata on the class itself

**Implementation files** (one per domain class) each do two things:

- `declare module '@assessmentis/clinical-domain'` augments the class's TypeScript interface and namespace, so the compiler knows the new properties exist
- `Object.defineProperty` on the class and its prototype attaches the actual runtime behavior — static values on the constructor, computed getters on instances

**Side-effect import** — importing the implementation file executes the `Object.defineProperty` calls. The barrel `index.ts` re-exports all implementations so a single import activates everything.

### Example: Location as a PickerItem

The implementation file for Location:

1. Augments `Location` (interface) to include `PickerItem` instance property
2. Augments `Location` (namespace) to include static `PickerItem.Placeholder` and `PickerItem.Label`
3. Defines a static property on `Location` with `{ Placeholder: 'Select a location...', Label: 'Location' }`
4. Defines a prototype getter that computes `{ id, display, secondary }` from the instance's FHIR fields (`name`, `description`, `status`, `url`)

After importing the implementation, `location.PickerItem.display` returns the location's name, and `Location.PickerItem.Placeholder` returns `'Select a location...'`.

## Why This Design

**Domain purity** — The `clinical-domain` package has no knowledge of pickers, display formatting, or React. All UI-specific logic lives in the frontend.

**Open/closed** — Adding picker support for a new resource means writing one implementation file. Nothing else changes — not the trait interface, not `ResourcePicker`, not the domain.

**Type safety at consumption** — `ResourcePicker` constrains its generic to `PickerItemClass & DomainTypedClass<K>`, so TypeScript enforces at the call site that you can only pass classes that have both a `DomainType` (from the domain) and a `PickerItem` trait (from the augmentation). Passing a class without a picker implementation is a compile error.

**Colocation of logic** — Each implementation file is the single place that decides how a resource type maps to picker display. The display logic, the placeholder text, and the type augmentation all live together.

## Trait Catalog

### Labeled (class-level statics only)

Provides `singularLabel` and `pluralLabel` on the class. Used by page titles, breadcrumbs, create buttons, and empty messages. Also serves as the default source for PickerItem's `Placeholder` and `Label` statics via the `applyPickerStatics` helper.

### Listable (instance-level properties)

Provides `displayName` and `summaryItems` on each instance. Used by `ResourceListIndexPage` to render list items without per-resource ListItem components. Each implementation encapsulates the display logic that was previously spread across `getDisplayName`/`getListSummaryItems` config functions and custom ListItem components.

### PickerItem (instance + class properties)

Provides `{ id, display, secondary }` on instances and `{ Placeholder, Label }` on the class. Used by `ResourcePicker` and `BasePicker`. PickerItem statics now derive from Labeled by default (via `applyPickerStatics`), with per-resource overrides where needed (e.g. "Select an encounter..." for correct article).

### BreadcrumbLabel (instance-level property)

Provides `BreadcrumbLabel: string` on each instance — the display name shown in breadcrumbs for detail and edit pages. Each implementation derives the label from the resource's key fields (e.g. Patient uses `formatHumanName`, Observation uses `code.text`). Used by `EditResourcePage` to set the breadcrumb label after loading a resource. Includes `assertBreadcrumbLabel` for narrowing through generic `ResourceDataTypes[K]`.

### HubResource (type-level marker)

A type-only constraint (`HubResourceClass<K>`) that narrows `DomainTypedClass<K>` to keys present in `ResourceDataTypes`. No runtime behavior — used by `useResourceCollection` and `ResourceListIndexPage` to ensure only hub-available classes are passed. No implementation files needed; all resource classes satisfy it structurally.

## Trait Interactions

Traits are independent by default but can compose:

- **PickerItem reads from Labeled**: `applyPickerStatics(klass)` reads `klass.Labeled.singularLabel` to derive default Placeholder/Label. This is a runtime read, so the Labeled implementation must be imported before the PickerItem implementation.
- **ResourceListIndexPage requires multiple traits**: Constrains its `klass` prop to `ListableClass & LabeledClass & HubResourceClass<K> & DomainTypedClass<K>`. TypeScript enforces at the call site that all traits are implemented.
- **Labeled and Listable are independent**: They don't reference each other. A resource can have labels without being listable (e.g. Media).

## The DomainTyped Companion

`DomainTyped` follows the same shape — instances have `domainType: T`, classes have a static `DomainType: T`. Unlike `PickerItem`, this one is defined inside the domain package itself (via the `Resource(Key)` base class), but the `DomainTypedClass<K>` interface is used alongside trait interfaces as a **joint constraint** to tie a class back to its `ResourceDataTypes` key.

## Data Flow

```
Domain class (pure, from clinical-domain)
    ↓  module augmentation + Object.defineProperty (side-effect import)
Domain class + trait (frontend)
    ↓  passed as `klass` prop
ResourcePicker({ klass: Location, ... })
    ↓  usePickerData → hub.subscribeSearch(klass.DomainType)
    ↓  instances arrive with .PickerItem getter active
BasePicker renders using item.PickerItem.display / .secondary
```

## Tradeoffs

- **Side-effect imports are load-order sensitive.** The `Object.defineProperty` calls must run before any code accesses the augmented properties. The barrel re-export and standard module bundling make this reliable in practice, but it's a coupling that isn't visible in the type system.
- **`Object.defineProperty` bypasses the class definition.** Tooling like "go to definition" won't find the getter on the prototype. The `declare module` augmentation helps the compiler, but the runtime wiring is invisible to static analysis.
- **One file per resource per trait.** This is deliberate (colocation), but it means adding a new trait to all resources requires touching N files.
