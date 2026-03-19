# new-domain-package

Create a new domain package with proper structure and configuration.

**Package name:** $ARGUMENTS

## Steps

1. Create directory structure under `domain/$ARGUMENTS/`
2. Create `package.json` with:
   - Package name: `@assessmentis/$ARGUMENTS`
   - Dependencies: `effect`, workspace references to `@assessmentis/ontology` and `@assessmentis/typescript-config`
   - Scripts: `typecheck`, `test`, `lint`, `build`
3. Create `tsconfig.json` extending from `../../global/typescript-config/base.json`
4. Create `src/index.ts` with barrel exports
5. Create initial test file `src/index.test.ts`
6. Add package to root `package.json` workspaces if needed
7. Run `npm install` from repository root
8. Verify typecheck passes with `npm run typecheck`
9. Document package purpose in README.md

## Example package.json

```json
{
  "name": "@assessmentis/$ARGUMENTS",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "typecheck": "npx tsgo --noEmit",
    "test": "vitest run",
    "lint": "eslint .",
    "build": "tsc"
  },
  "dependencies": {
    "effect": "^3.19.8"
  },
  "devDependencies": {
    "@assessmentis/ontology": "*",
    "@assessmentis/typescript-config": "*",
    "@types/node": "^22.0.0",
    "typescript": "^5.9.0",
    "vitest": "^4.0.15"
  }
}
```

## Domain Package Rules

Remember:

- ⚠️ Keep packages PURE (no side effects, no HTTP calls, no infrastructure)
- ✅ Use Effect-TS for all business logic
- ✅ Define repository interfaces as Effect Tags
- ✅ Use Effect Schema for data validation
- ✅ Write property-based tests with fast-check
