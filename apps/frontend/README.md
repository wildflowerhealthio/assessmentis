# Assessment.is Frontend

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

The React-based frontend application for Assessment.is, built with React Router v7 in SPA mode.

## What This Application Does

- Provides the user interface for conducting diagnostic assessments
- Integrates video calls with questionnaire administration
- Manages encounters, questionnaires, and questionnaire responses
- Uses Firebase for authentication and hosting

## Technology Stack

- **React 19** with React Router v7 (SPA mode)
- **Vite** for build tooling
- **Effect-TS** for state management and business logic
- **Firebase Auth** for authentication
- **Tundra CSS** for styling
- **OpenTelemetry** for observability

## Development

### Start Development Server

```bash
npm run dev
```

Application will be available at `http://localhost:5173`.

### Building

```bash
npm run build
```

### Deployment

Deployed to Firebase Hosting:

```bash
npm run deploy
```

## Project Structure

See `copilot-instructions.md` for detailed architecture and patterns.

```
app/
├── root.tsx           # Root layout and error boundary
├── routes/            # File-based routing
├── modules/           # Feature modules
├── components/        # Shared UI components
└── clientRuntime.tsx  # Effect runtime setup
```

## Important Guidelines

### ✅ DO:

- Use Effect-TS for business logic via clientRuntime
- Follow React Router v7 file-based routing conventions
- Use Tundra CSS utilities for styling
- Use domain packages for types and logic
- Test critical user flows

### ❌ DON'T:

- Add business logic directly in components (use domain packages)
- Bypass the Effect runtime
- Add inline styles (use Tundra CSS or CSS modules)
- Hardcode configuration (use config-domain and firebase-web-platform service)

## Related Packages

- `@assessmentis/clinical-domain`: Core types and interfaces
- `@assessmentis/react-util`: Shared React utilities
- `@assessmentis/firebase-web-infrastructure`: Firebase integration
- `@assessmentis/daily-co-infrastructure`: Video calls
