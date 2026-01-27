# Copilot Instructions for Assessment.is

## Project Overview

**Assessment.is** is a tool for conducting diagnostic interviews, specifically designed to support structured assessment questionnaires (like DIVA-2 for ADHD). The application enables healthcare professionals to conduct video-based assessments with integrated questionnaire responses stored in a FHIR-compliant format.

### Core Purpose

- Enable virtual encounters between healthcare providers and patients
- Administer structured diagnostic questionnaires during video calls
- Internally, data is represented in FHIR (Fast Healthcare Interoperability Resources) format
- Integrations
  - Integrate with Google Cloud Healthcare API for data persistence
  - Support video conferencing via Daily.co

## Architecture and System Design

### Monorepo Structure

This project uses a **Turborepo monorepo** with npm workspaces. The structure separates concerns into apps, domain logic, infrastructure, and shared configurations:

```
assessmentis/
├── apps/
│   ├── frontend/        # React Router v7 SPA
│   ├── functions/       # Firebase Cloud Functions
│   └── firecms/         # FireCMS admin interface
├── domain/              # Pure business logic (no side effects)
│   ├── clinical-domain/            # FHIR resources, repositories, clinical logic
│   └── platform-domain/            # User, Org, auth services
├── infrastructure/      # Concrete implementations of domain interfaces
│   ├── google-fhir-web-infrastructure/   # Browser-side FHIR client
│   ├── google-fhir-node-infrastructure/  # Server-side FHIR client (stub)
│   ├── firebase-web-infrastructure/      # Browser-side Firebase
│   ├── firebase-server-infrastructure/   # Server-side Firebase Admin SDK
│   ├── daily-co-infrastructure/          # Daily.co video integration
│   └── google-meet-infrastructure/       # Google Meet integration
└── global/              # Shared configurations and utilities
    ├── eslint-config/              # Shared ESLint configuration
    ├── prettier-config/            # Shared Prettier configuration
    ├── typescript-config/          # Shared TypeScript configurations
    ├── react-util/                 # Shared React components and hooks
    ├── ontology/                   # Shared types and utilities
    └── util/                       # Framework-agnostic utilities
```

### Key Architectural Principles

1. **Domain-Driven Design**: The `domain` packages contain all core business logic and are framework-agnostic
2. **Effect-TS First**: Heavy use of Effect-TS for functional, composable, and type-safe code
3. **FHIR Compliance**: All healthcare data structures follow FHIR R4 specifications
4. **Layered Architecture**: Infrastructure concerns are isolated in dedicated packages
5. **Type Safety**: Strict TypeScript with Effect Schema for runtime validation

### Platform Service Architecture

The frontend uses a **two-level context hierarchy** for dependency injection and service management:

```
PlatformContextProvider (root)
├── AuthDataService       # Authentication state management
├── OrgService            # Organization selection and loading
├── UserService           # User data and roles
├── FhirR4ClientService   # FHIR client for clinical data
├── ClinicalDataRepositoryService  # Repository factory
└── VideoCallClientService # Video call client
    │
    └── OrgContextProvider (child)
        └── Selected Org context for route components
```

**Service Initialization Flow:**

1. `PlatformContextProvider` initializes all core services using Effect Layers
2. Services use `PubSub` + `Stream` patterns for reactive state updates
3. `OrgContextProvider` subscribes to `OrgService` and provides org selection UI
4. Route components access services via `usePlatformContext()` hook

**Server vs Client Runtime:**

- **Client (Browser):** Uses `FirebaseWebDocumentStoreLayer` for Firestore access
- **Server (Cloud Functions):** Uses `FirebaseAdminDocumentStoreLayer` for admin SDK access

Both implement the `DocumentStore` interface from `platform-domain`, enabling shared business logic.

#### DocumentStore Abstraction

The `DocumentStore` tag class in `platform-domain/tagClasses/` provides an abstract interface for document operations:

```typescript
interface DocumentStore {
  get(...path: string[]) => Effect<DocumentData, NotFoundError | UnhandledError>
  subscribeTo(...path: string[]) => Stream<Either<DocumentData, NotFoundError>>
}
```

This abstraction enables:

- **Shared domain logic** between client and server
- **Testability** via mock implementations
- **Platform flexibility** (could swap Firebase for another backend)

**Platform Error Types** (from `platform-domain/errors.ts`):

- `AuthError` - User is not authenticated
- `AuthzError` - User lacks required permissions (authenticated but not authorized)

### Technology Stack

#### Frontend (apps/frontend)

- **React 19** with React Router v7 (SPA mode, SSR disabled)
- **Vite** for build tooling
- **Effect-TS** for functional effects and dependency injection
- **Firebase Auth** for authentication
- **Tundra CSS** for styling (utility-first CSS framework)
- **CSS Modules** for component-specific styles
- **OpenTelemetry** for observability and tracing

#### Backend (apps/functions)

- **Firebase Cloud Functions**
- **Effect-TS** for business logic
- **Daily.co API** integration

#### Domain Layer (packages/domain)

- **Effect-TS** for all business logic
- **Effect Schema** for runtime type validation
- **Vitest** for testing
- **FHIR R4** type definitions

#### Infrastructure

- **Firebase** (Hosting, Functions, Auth)
- **Google Cloud Healthcare API** (FHIR Store)
- **Daily.co** for video conferencing

## Project Structure and Organization

### Frontend Application Structure

The frontend follows a **feature-based organization** with clear separation of concerns:

```
apps/frontend/app/
├── root.tsx                    # Root layout and error boundary
├── routes/                     # File-based routing
│   ├── _index.tsx             # Home page
│   ├── Encounter._index.tsx   # Encounter list
│   ├── Encounter.$encounterId.tsx
│   ├── Questionnaire._index.tsx
│   └── QuestionnaireResponse.$questionnaireResponseId.tsx
├── layers/                     # Service composition layer
│   ├── PlatformContext.tsx    # Core services interface definition
│   ├── PlatformContextProvider.tsx  # Initializes all platform services
│   ├── OrgContext.tsx         # Organization selection context
│   ├── OrgContextProvider.tsx # Org selection and validation
│   ├── FhirR4ClientService.tsx       # FHIR client service
│   ├── ClinicalDataRepositoriesService.ts  # Repository factory
│   └── VideoCallClientService.tsx  # Video call client
├── modules/                    # Feature modules
│   ├── encounters/
│   │   └── actions/           # Business logic for encounters
│   ├── interview-call/
│   │   ├── actions/
│   │   └── features/          # Interview call UI components
│   ├── questionnaire/
│   │   └── features/          # Questionnaire UI components
│   └── admin/
│       └── questionnaire-templates/  # Questionnaire templates
├── components/                 # Shared UI components
│   ├── NavHeader.tsx
│   └── LoginButton.tsx
├── firebase.tsx               # Firebase initialization
└── globals.css                # Global styles
```

### Domain Package Structure

Domain packages contain pure business logic with no side effects. There are multiple domain packages:

#### Clinical Domain (`domain/clinical-domain/`)

Organized by **FHIR resources**:

```
domain/clinical-domain/src/
├── index.ts
├── errors.ts                  # Domain error types (NotFoundError, UnhandledError)
├── general-purpose/           # Base FHIR types (Element, Resource, etc.)
├── encounters/
│   ├── models/               # Encounter domain models
│   ├── EncounterRepository.ts
│   └── index.ts
├── questionnaires/
│   ├── models/               # Questionnaire and Response models
│   ├── extensions/           # Custom FHIR extensions
│   ├── QuestionnaireRepository.ts
│   ├── QuestionnaireResponseRepository.ts
│   └── index.ts
├── video-calls/
│   ├── models/
│   ├── VideoCallRepository.ts
│   └── index.ts
└── compositions/             # FHIR Composition resources
```

#### Platform Domain (`domain/platform-domain/`)

User, organization, and authentication services:

```
domain/platform-domain/src/
├── models/                    # Data schemas
│   ├── User.ts               # User profile with org roles
│   ├── Org.ts                # Organization model
│   ├── OrgRole.ts            # Organization role mapping
│   ├── FrontendConfig.ts     # Per-org frontend configuration
│   └── IdTypes.ts            # Brand types (OrgSlug, Role, UserId)
├── services/                  # Server-side services
│   ├── LoadedOrg.ts          # Effect Tag for loaded org instance
│   ├── LoadedUser.ts         # Effect Tag for loaded user instance
│   ├── OrgAdminService.ts    # Org administration operations
│   └── OrgUserService.ts     # User authorization checks
├── hostedServices/           # Client-side reactive services
│   ├── OrgService.ts         # Org selection with streams
│   └── UserService.ts        # User data with streams
├── tagClasses/               # Effect context tags
│   ├── AuthDataService.ts    # Authentication stream
│   ├── CurrentOrg.ts         # Current org context
│   ├── CurrentUserId.ts      # Current user context
│   └── DocumentStore.ts      # Document repository interface
└── errors.ts                 # AuthError, AuthzError
```

### Naming Conventions

#### Files and Folders

- **PascalCase** for component files: `NavHeader.tsx`, `QuestionnaireForm.tsx`
- **camelCase** for utility files: `firebase.tsx`, `create.ts`
- **Folders**: Use singular nouns when possible, plural for collections: `components/`, `actions/`, `models/`

#### Code

- **PascalCase** for types, interfaces, classes, React components, and Effect Tags
- **camelCase** for variables, functions, and properties
- **UPPER_SNAKE_CASE** for constants (rare, prefer const declarations)
- Prefix interfaces with `I` only when necessary for clarity (generally avoid)

#### React Components

- Use **default exports** for route components and main feature components
- Use **named exports** for shared/reusable components
- Component files should match component name: `NavHeader.tsx` exports `NavHeader`

## Code Style and Conventions

### TypeScript

#### Type Safety

- Enable strict mode (already configured in `tsconfig.json`)
- Use `Schema` from Effect for runtime validation
- Prefer `type` over `interface` for object types
- Use branded types for IDs: `Schema.String.pipe(Schema.brand("EncounterId"))`

#### Type Annotations

- Explicitly type function parameters
- Let TypeScript infer return types when obvious
- Use Effect-TS type utilities: `Effect.Effect<Success, Error, Requirements>`

### Effect-TS Patterns

#### Repository Pattern

All data access goes through repositories defined as Effect Tags:

```typescript
export class QuestionnaireRepository extends Context.Tag(
  'QuestionnaireRepository'
)<
  QuestionnaireRepository,
  {
    getQuestionnaires: () => Effect.Effect<
      ReadonlyArray<WithId<Questionnaire>>,
      UnhandledError | NeedsAuthenticationError,
      never
    >
    // ... other methods
  }
>() {}
```

#### Effect Generators

Use generator syntax for Effect composition:

```typescript
export const create = (args: CreateEncounterArg) =>
  Effect.gen(function* () {
    const encounterRepository = yield* EncounterRepository
    const createdEncounter = yield* encounterRepository.create(args)
    return createdEncounter
  })
```

#### Error Handling

- Define domain-specific errors extending `Data.TaggedError`
- Use Effect's type system to track possible errors
- Handle errors at boundaries (UI components, API handlers)

#### Layers and Dependency Injection

- Use `Layer` to compose dependencies
- Define layers in infrastructure packages
- Frontend composes services in `layers/PlatformContextProvider.tsx`
- Cloud Functions compose services in their respective handlers

### React Patterns

#### Hooks

- Access platform services via `usePlatformContext()` from `layers/PlatformContext`
- Run effects in `useEffect` with proper cleanup
- Use custom hooks from `@assessmentis/react-util/hooks` when available

#### State Management

- Local state with `useState` for UI state
- Effect-TS runtime for data fetching and business logic
- No global state library (Redux, Zustand, etc.)

#### Component Structure

```typescript
'use client' // Used in this codebase for React Router v7 compatibility

import { useState, useEffect } from 'react'
// ... other imports

type IProps = {
  // Props definition
}

const ComponentName = ({ prop1, prop2 }: IProps) => {
  // Hooks
  const [state, setState] = useState()
  const platform = usePlatformContext()

  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies])

  // Event handlers
  const handleEvent = () => {
    // Handler logic
  }

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}

export default ComponentName
```

#### Props Types

- Use `type IProps` for component props
- Use `Route.LoaderParams`, `Route.ActionParams` etc. from React Router types

### Styling

#### CSS Strategy

1. **Tundra CSS** for utility classes (similar to Tailwind)
2. **CSS Modules** for component-specific styles
3. **Global styles** in `globals.css` (minimal)

#### Tundra CSS Classes

- Use semantic class names from Tundra: `element-button`, `button-3`, `filled`, `accent-blue`
- Typography: `heading-1`, `heading-2`, `text-alt-heading-3`
- Spacing: `var(--space-1)` through `var(--space-10)`
- Colors: `var(--neutral-1)` through `var(--neutral-9)`

#### CSS Modules

- Import as: `import classes from './Component.module.css'`
- Use `cn()` utility from `@assessmentis/react-util` to combine classes
- Keep modules small and component-specific
- Classes should be named with Block-Element-Modifier style names

#### Inline Styles

- Use for dynamic styles or one-off values. Prefer adding a CSS Module
- Use CSS custom properties: `var(--space-4)`, `var(--radius-1)`

### Linting and Formatting

#### Prettier Configuration

```javascript
{
  trailingComma: "es5",
  tabWidth: 2,
  semi: false,        // No semicolons
  singleQuote: true   // Single quotes for strings
}
```

#### ESLint Rules

- **Unused vars**: Prefix with `_` to ignore: `const _unused = value`
- **React Hooks**: Follow hooks rules strictly
- **React Refresh**: Allow specific exports in route files (loader, action, etc.)
- **Prettier integration**: Format on lint via `eslint-plugin-prettier`

### Import Organization

Organize imports in this order:

1. React and React-related libraries
2. Third-party libraries
3. Effect-TS imports
4. Domain imports (`@assessmentis/clinical-domain/*`)
5. Infrastructure imports (`@assessmentis/*-infrastructure`)
6. Local utility imports (`@assessmentis/react-util`)
7. Relative imports (components, styles)
8. Type imports (if using `import type`)

Example:

```typescript
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { Effect, Schema } from 'effect'
import { Questionnaire } from '@assessmentis/clinical-domain/questionnaires'
import { FhirClient } from '@assessmentis/google-fhir-web-infrastructure'
import { cn } from '@assessmentis/react-util'
import { usePlatformContext } from 'app/layers/PlatformContext'
import NavHeader from './components/NavHeader'
import classes from './Component.module.css'
```

## Best Practices and Patterns

### FHIR Modeling

- Follow FHIR R4 specifications strictly
- Use Effect Schema to model FHIR resources
- Support optional fields as per FHIR spec
- Use custom extensions for application-specific data:
  - URL format: `http://assessment.is/fhir/{extension-name}`
  - Store in `extension` or `modifierExtension` arrays

### Schema Definition with Effect

- Define schemas using `Schema.Struct`
- Use branded types for IDs and specific string types
- Support recursive structures with `Schema.suspend`
- Provide both encoding and decoding types

Example:

```typescript
export const QuestionnaireId = Schema.String.pipe(
  Schema.brand('QuestionnaireId')
)

export const Questionnaire = Schema.Struct({
  resourceType: Schema.Literal('Questionnaire'),
  id: Schema.optional(QuestionnaireId),
  status: Schema.Union(
    Schema.Literal('draft'),
    Schema.Literal('active'),
    Schema.Literal('retired')
  ),
  // ... other fields
})

export type Questionnaire = typeof Questionnaire.Type
```

### Repository Implementation

1. Define repository interface as Effect Tag in domain package
2. Implement concrete repository in infrastructure package
3. Use Effect.gen for async operations
4. Return proper error types in Effect signature
5. Provide repository via Layer

### Component Patterns

#### Feature Components

- Large, feature-specific components go in `modules/{feature}/features/`
- Include CSS module alongside component
- Can include sub-components folder
- Example: `modules/questionnaire/features/QuestionnaireForm/`

#### Shared Components

- Small, reusable components go in `components/` or `packages/react-util/components/`
- Should be framework-agnostic when possible
- Provide clear prop types

#### Form Handling

- Use controlled components with `useState`
- Use Effect to persist data

### Error Handling

#### Domain Errors

Define custom errors in `packages/domain/src/errors.ts`:

```typescript
export class NeedsAuthenticationError extends Data.TaggedError(
  'NeedsAuthenticationError'
)<{ cause?: unknown }> {}
```

#### Error Boundaries

- Use React Router's `ErrorBoundary` export in route files
- Check error type with Effect's `Cause` utilities
- Provide user-friendly messages and actions
- Log detailed errors in development

#### Effect Error Flow

```typescript
Effect.gen(function* () {
  const repo = yield* SomeRepository
  const result = yield* repo.getData() // Can fail with typed errors
  return result
}).pipe(
  Effect.catchTag('NotFoundError', (error) =>
    Effect.fail(/* handle specific error */)
  ),
  Effect.catchAll((error) => Effect.fail(new UnhandledError({ cause: error })))
)
```

### Testing

#### Unit Tests

- Use Vitest for testing
- Test Schema encoding/decoding (see `QuestionnaireResponseItemAnswer.test.ts`)
- Use Effect's test utilities
- Test files alongside source: `*.test.ts`

#### Storybook

- Use Storybook for component development
- Story files alongside components: `*.stories.tsx`

### Performance Considerations

- Use CSS Modules and Tundra CSS (no runtime CSS-in-JS)
- Lazy load routes with React Router's code splitting (automatic)
- Memoize expensive computations with `useMemo`
- Use Effect's caching and memoization features
- Keep Effect chains efficient (avoid unnecessary work)

### Security

- Never commit secrets or API keys
- Use Firebase Auth for authentication
- Validate all user input with Effect Schema
- Use FHIR's security best practices
- Sanitize data before display (React does this by default)

## Development Workflow

### Local Development

#### Initial Setup

```bash
npm install                 # Install dependencies
```

#### Running the Application

```bash
npm run dev                 # Start all dev servers (Turbo)
cd apps/frontend && npm run dev  # Start only frontend
```

#### Linting and Type Checking

```bash
npm run lint               # Lint all packages
npm run format             # Format all files with Prettier
cd apps/frontend && npm run typecheck  # Type check
```

#### Building

```bash
npm run build              # Build all packages (Turbo)
```

### Turborepo Tasks

The project uses Turborepo for task orchestration:

- **build**: Build package/app (depends on dependencies being built first)
- **lint**: Run ESLint
- **lint:fix**: Run ESLint with auto-fix
- **typecheck**: Run TypeScript compiler without emitting files
- **dev**: Start development server (for apps)

### Git Workflow

- Use conventional commits (optional but recommended)
- Keep changes focused and small
- Write descriptive commit messages
- Run lint and type check before committing

### Deployment

#### Frontend

```bash
cd apps/frontend
npm run build              # Build for production
npm run deploy             # Deploy to Firebase Hosting
```

#### Functions

Configured in `firebase.json` with predeploy hooks:

```bash
firebase deploy --only functions
```

## Common Patterns and Idioms

### Adding a New Route

1. Create route file in `apps/frontend/app/routes/`:

```typescript
// routes/NewResource._index.tsx
import type { Route } from './+types/NewResource._index'

export async function loader({ params }: Route.LoaderParams) {
  // Optional loader
}

export default function NewResourceIndex() {
  return <div>New Resource</div>
}
```

2. File-based routing (React Router v7):

- `_index.tsx` → index route
- `$param.tsx` → dynamic route
- `Prefix.$param.tsx` → nested dynamic route
- Route files automatically become routes

### Using Effect in React

Access platform services via `usePlatformContext()`:

```typescript
const Component = () => {
  const { clinicalDataRepositoryService } = usePlatformContext()
  const [data, setData] = useState<Data | null>(null)

  useEffect(() => {
    const effect = Effect.gen(function* () {
      const repo = yield* clinicalDataRepositoryService.repositoryEffect('Encounter')
      return yield* repo.getAll()
    })

    Effect.runPromise(effect)
      .then(setData)
      .catch((error) => {
        console.error(error)
        // Handle error
      })
  }, [clinicalDataRepositoryService])

  return <div>{data ? <Display data={data} /> : 'Loading...'}</div>
}
```

## Additional Notes

### React Router v7

- **SPA mode** is enabled (SSR disabled in config)
- File-based routing with `routes/` directory
- Use route-specific types from `+types/` virtual modules
- Export `loader`, `action`, `ErrorBoundary`, etc. from route files
- `'use client'` directive is used in this codebase (appearing in ~8 component files) for React Router v7 compatibility, even though SSR is disabled

### OpenTelemetry

- Configured in `layers/PlatformContextProvider.tsx` with WebSDK
- Use Effect's tracing capabilities
- Spans are automatically created for Effects
- Annotate with `Effect.withSpan` when needed

### Firebase

- Authentication via Google Sign-In
- Hosting for frontend SPA
- Cloud Functions for backend API
- Configuration in `firebase.json`

### CSS Custom Properties

The project uses Tundra CSS variables:

- Spacing: `--space-1` to `--space-10`
- Radii: `--radius-1` to `--radius-4`
- Colors: `--neutral-1` to `--neutral-9`, `--blue-1` to `--blue-9`, etc.
- App-specific: `--app-accent`, `--app-foreground`, `--app-background`

### When to Use Each Package

**Domain packages** (pure business logic):

- **@assessmentis/clinical-domain**: FHIR resources, clinical repositories, business logic
- **@assessmentis/platform-domain**: User, Org, auth services, DocumentStore interface

**Infrastructure packages** (concrete implementations):

- **@assessmentis/google-fhir-web-infrastructure**: Browser-side FHIR client
- **@assessmentis/firebase-web-infrastructure**: Browser-side Firestore via Firebase SDK
- **@assessmentis/firebase-server-infrastructure**: Server-side Firestore via Admin SDK
- **@assessmentis/daily-co-infrastructure**: Daily.co Effect-TS layer for video call services

**Global packages** (shared utilities):

- **@assessmentis/react-util**: Shared React hooks, components, utilities
- **@assessmentis/daily-co-components**: Daily.co React UI components for video calls
- **@assessmentis/ontology**: Shared types and utilities
- **@assessmentis/eslint-config**: Import in `eslint.config.js`
- **@assessmentis/prettier-config**: Set in `package.json` "prettier" field
- **@assessmentis/typescript-config**: Extend in `tsconfig.json`

## Summary for AI Code Assistants

When contributing to this codebase:

1. **Use Effect-TS** for all async operations and dependency management
2. **Follow FHIR R4** specifications for healthcare data
3. **Maintain type safety** with TypeScript strict mode and Effect Schema
4. **Use the repository pattern** for data access
5. **Organize by feature/domain** not by technical layer
6. **Style with Tundra CSS + CSS Modules**, not inline styles (except for dynamic values)
7. **No semicolons**, single quotes, 2-space indentation
8. **Test schemas** with encode/decode tests
9. **Handle errors** with Effect's typed error system
10. **Keep it simple**: prefer explicit over clever, readable over terse

This is a healthcare application, so **correctness, type safety, and maintainability** are more important than clever abstractions or bleeding-edge features.
