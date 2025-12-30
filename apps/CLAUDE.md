# apps/ - Application-Level Guidance

This directory contains end-user applications. See [../CLAUDE.md](../CLAUDE.md) for general project guidance.

## Applications in This Directory

- **frontend/** - React Router v7 SPA (main user interface)
- **functions/** - Firebase Cloud Functions (backend services)
- **firecms/** - FireCMS admin interface
- **aws_infra/** - AWS CDK infrastructure for Daily.co recording storage

## General App Guidelines

### What Apps Should Do
✅ Compose domain and infrastructure layers
✅ Handle user interaction and routing
✅ Integrate with external services (Firebase, Google Cloud)
✅ Manage application-specific configuration

### What Apps Should NOT Do
❌ Duplicate logic from domain packages
❌ Bypass domain repositories (always go through domain interfaces)
❌ Define domain models (use domain packages instead)
❌ Include business logic (belongs in domain)

## Firebase Deployment Commands

### Frontend Deployment
```bash
cd apps/frontend
npm run build                      # Build React Router SPA
firebase deploy --only hosting     # Deploy to Firebase Hosting
```

### Functions Deployment
```bash
cd apps/functions
npm run build                      # TypeScript compilation
firebase deploy --only functions   # Deploy all functions
firebase deploy --only functions:functionName  # Deploy specific function
```

### Local Development with Emulators
```bash
firebase emulators:start --only functions  # Test functions locally
firebase emulators:start --only hosting    # Test hosting locally
```

## Adding a New Firebase Cloud Function

1. Create new function file in `apps/functions/src/`
2. Follow existing pattern for function exports
3. Add function name to `firebase.json` if needed
4. Test locally with Firebase emulators
5. Deploy with `firebase deploy --only functions:functionName`
6. Verify deployment in Firebase Console

Example function structure:
```typescript
import { onRequest } from 'firebase-functions/v2/https'
import { Effect } from 'effect'

export const myNewFunction = onRequest(
  { region: 'northamerica-northeast2' },
  async (request, response) => {
    // Use Effect-TS for business logic
    const program = Effect.gen(function* () {
      // Implementation
    })

    // Run Effect program
    const result = await Effect.runPromise(program)
    response.json(result)
  }
)
```

## Environment Configuration

Apps read environment configuration from:
- Frontend: `.env` files (Vite env vars)
- Functions: Firebase Functions config + environment variables
- Both: Effect-TS `Config` for type-safe configuration

## Testing Apps

- Frontend: Component tests with React Testing Library
- Functions: Integration tests with Firebase emulators
- Both: Property-based tests for business logic (use domain tests)

## See Also

- [frontend/CLAUDE.md](frontend/CLAUDE.md) - React/UI specific patterns (when created)
- [../CLAUDE.md](../CLAUDE.md) - Root project guidance
- [../CONTRIBUTING.md](../CONTRIBUTING.md) - Full contribution guidelines
