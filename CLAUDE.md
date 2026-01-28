# CLAUDE.md - Claude Code Quick Reference

This file provides Claude Code-specific guidance for the Assessment.is project. For comprehensive documentation, see:
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development setup, code style, testing patterns
- [copilot-instructions.md](./copilot-instructions.md) - Detailed architecture documentation
- [Testing docs](./docs/testing/testing.md) - Testing philosophy and patterns

## Essential Commands

### Development
```bash
npm run dev              # Start all dev servers with Turbo (persistent cache disabled)
npm run build            # Build entire monorepo with Turbo orchestration
npm run typecheck        # Type check all packages (dependencies checked first)
npm run test             # Run all Vitest tests across packages
npm run lint:fix         # Auto-fix ESLint issues across all packages
npm run format           # Format all files with Prettier
```

### Frontend Specific (from apps/frontend/)
```bash
npm run dev              # React Router dev server with HMR
npm run build            # Build React Router SPA
npm run typegen          # Generate React Router types
firebase deploy --only hosting  # Deploy frontend to Firebase Hosting
```

### Backend Specific (from apps/functions/)
```bash
npm run build            # TypeScript compilation for Cloud Functions
firebase emulators:start --only functions  # Local Firebase Functions emulator
firebase deploy --only functions          # Deploy functions to Firebase
```

### Git Operations
```bash
git status               # Check working tree status
git diff                 # View unstaged changes
git log --oneline -10    # View recent commits
gh pr create             # Create pull request
gh pr view               # View current PR details
gh issue list            # List open issues
```

## Quick Architecture Reference

Assessment.is is a **Turborepo monorepo** with:
- **apps/** - Frontend React SPA + Firebase Cloud Functions
- **domain/** - Pure business logic (no side effects, framework-agnostic)
- **infrastructure/** - Concrete implementations of domain interfaces
- **global/** - Shared configurations and utilities

**Key Pattern:** Domain defines interfaces with Effect Tags → Infrastructure provides Layer implementations → Apps compose layers

For detailed architecture, see [copilot-instructions.md](./copilot-instructions.md).

## FHIR R4 Critical Rules

⚠️ **NEVER modify FHIR resource schemas without domain expert review**

All clinical data in this project MUST follow the FHIR R4 specification:
- Use Effect Schema for both compile-time and runtime validation
- Always add round-trip property tests for FHIR resources
- Reference official spec: https://hl7.org/fhir/R4/

Example round-trip test pattern:
```typescript
import { fc } from 'fast-check'
import { Schema } from 'effect'

it('should round-trip correctly', () => {
  fc.assert(
    fc.property(Schema.arbitrary(MyFHIRResource)(fc), (data) => {
      const encoded = Schema.encodeSync(MyFHIRResource)(data)
      const decoded = Schema.decodeSync(MyFHIRResource)(encoded)
      expect(decoded).toEqual(data)
    })
  )
})
```

## Testing Quick Reference

**Property-based testing FIRST** - Use fast-check with Effect Schema arbitraries

Key principles:
- Test properties, not examples (idempotence, reversibility, invariants)
- Use Effect Schema as arbitraries: `Schema.arbitrary(MySchema)(fc)`
- Keep tests MECE (Mutually Exclusive, Completely Exhaustive)
- Helper identity tests: verify `get(with(x)) === x`

For comprehensive patterns, see [docs/testing/](./docs/testing/testing.md).

## Common Claude Code Workflows

### Adding a New Domain Package

1. Create directory under `domain/`
2. Copy `package.json` from similar domain package
3. Create `tsconfig.json` extending from `global/typescript-config`
4. Add `src/index.ts` with barrel exports
5. Run `npm install` from root
6. Add to `turbo.json` dependencies if needed
7. Verify with `npm run typecheck`

### TDD with Property-Based Testing

1. Write failing property tests using fast-check + Effect Schema
2. Run `npm run test` to confirm failure
3. Commit failing tests first
4. Implement code to make tests pass
5. Run full test suite: `npm run test`
6. Run type check: `npm run typecheck`
7. Commit working implementation

### Working with FHIR Resources

1. Define schema in `domain/clinical-domain` using Effect Schema
2. Follow FHIR R4 spec exactly (reference: https://hl7.org/fhir/R4/)
3. Add round-trip property tests
4. Export from `src/index.ts`
5. Verify with `npm run typecheck` and `npm run test`

### Parallel Development with Git Worktrees

Git worktrees enable working on multiple features simultaneously without branch switching:

```bash
# Create worktree for new feature
git worktree add ../assessmentis-feature-name feature-branch-name

# Work in separate terminal/IDE window
cd ../assessmentis-feature-name
claude

# Cleanup when done
git worktree remove ../assessmentis-feature-name
```

**Benefits:**
- Run multiple Claude instances on different features
- Keep builds separate
- No context switching overhead
- Ideal for monorepo parallel work

## Git Workflow with Claude

- **Branch naming:** `username/type-description` (e.g., `ruthmarks/feat-add-dailyco-s3-setup`)
- **Commit style:** Use `git log` to understand existing commit message style before committing
- **PR requirements:** All checks pass (lint, typecheck, test)
- **Main branch:** `main`

## Critical Warnings

⚠️ **Node.js 22.x REQUIRED** (won't work with 20.x or older)
⚠️ **npm 10.9.2+ REQUIRED**
⚠️ **NEVER modify FHIR resource schemas without domain expert review**
⚠️ **Effect Schema changes MUST include corresponding test updates**
⚠️ **Keep domain packages pure** (no side effects, no HTTP calls, no infrastructure)

## Using Claude Code with GitHub Copilot

The team uses GitHub Copilot for code reviews - Claude Code complements this workflow:

### Copilot's Strengths (use for)
- Inline code suggestions and completions
- Real-time code review feedback in PRs
- Quick refactoring suggestions

### Claude Code's Strengths (use for)
- Complex multi-file refactorings across domain boundaries
- Property-based test generation with fast-check
- FHIR resource creation following domain patterns
- Architectural changes spanning multiple packages
- Exploring unfamiliar parts of codebase (e.g., "How does questionnaire scoring work?")
- Batch operations (e.g., "Add property tests to all FHIR resources")
- Git workflows (commits, rebases, conflict resolution)

### Recommended Workflow

Use Copilot for day-to-day coding and PR reviews.

Use Claude Code for complex tasks like:
- "Add property tests for all FHIR resources in clinical-domain"
- "Refactor authentication to use new Effect-TS pattern"
- "Explain how the questionnaire scoring system works"
- "Add a new questionnaire type following existing patterns"

**Note:** Both tools can run simultaneously - they serve different purposes and don't conflict.

## Permissions Philosophy

Claude Code permissions allow common safe operations (read, edit, test, lint, commit) while requiring explicit approval for deployments and destructive actions.

Currently allowed operations:
- File editing (Edit tool)
- Git operations (status, diff, log, add, commit)
- Development tasks (typecheck, test, lint:fix, build, format)
- Firebase emulators (local testing)
- GitHub operations (pr, issue, label)
- Turbo commands (monorepo orchestration)

Still requires approval:
- `firebase deploy` - Production deployments
- `git push` - Remote repository changes
- `npm install` - Dependency changes
- Destructive operations (rm, force push, etc.)

Use `/permissions` command to manage the allowlist.

## UI Development with Visual Feedback

For frontend work in `/apps/frontend`:

1. Implement component following React Router v7 patterns
2. Take screenshot (macOS: Cmd+Ctrl+Shift+4, then paste)
3. Compare to design mockup if available
4. Iterate until match
5. Add property-based component tests
6. Commit when satisfied

## End-to-End Testing with Playwright

### Running E2E Tests

```bash
cd apps/frontend
npm run test:e2e              # Run all E2E tests headless
npm run test:e2e:ui           # Open Playwright UI for interactive testing
npm run test:e2e:debug        # Debug tests with Playwright Inspector
npm run test:e2e:codegen      # Generate test code by recording actions
```

### Using the Web App with Claude Code

Claude Code can interact with the running web app through Playwright MCP:

**Starting the App:**
```bash
npm run dev  # Start dev server on http://localhost:5173
```

**Interacting with the App:**
Once the dev server is running, Claude Code can:
- Navigate to pages: "Open http://localhost:5173 in Playwright"
- Take screenshots: "Take a screenshot of the current page"
- Click elements: "Click the 'Create Encounter' button"
- Fill forms: "Fill in patient name with 'John Doe'"
- Verify UI: "Check if the encounter list shows 3 items"

**Visual Verification Workflow:**
1. Make code changes
2. Ask Claude to open the app in Playwright
3. Navigate to the changed feature
4. Take screenshot for verification
5. Iterate based on visual feedback

See [apps/frontend/CLAUDE.md](apps/frontend/CLAUDE.md) for detailed E2E testing patterns.

## See Also

- Custom slash commands: `.claude/commands/` (once created)
- Domain-specific guidance: `apps/CLAUDE.md`, `domain/CLAUDE.md`, `infrastructure/CLAUDE.md`, `apps/frontend/CLAUDE.md`
