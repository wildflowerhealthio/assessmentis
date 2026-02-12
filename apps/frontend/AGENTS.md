# AGENTS.md — apps/frontend/

React Router v7 SPA with Tundra CSS and Effect-TS.

## Traps

- **Tundra heading scale is inverted**: `heading-6` is largest, `heading-1` is smallest
- **Use ternaries, not `&&`** for conditional JSX (falsy value issues)
- **Use `shouldShowRawData(data)`** not `import.meta.env.DEV` for debug displays
- **Route files should be thin** — extract logic to components/utils

## References

- [Design Reference](./Design%20Reference.md) — Typography, colors, spacing, CSS module naming
- [Design Reference](./Design%20Reference.md) — Typography, colors, spacing, page structures, loading states
- [Resource CRUD How-To](./app/modules/resources/Resource%20CRUD%20How-To.md) — Full resource CRUD implementation

## Commands

```bash
npm run dev          # Dev server with HMR
npm run build        # Build SPA
npm run typegen      # Generate React Router types
npm run test:e2e     # Playwright tests
npm run test:e2e:ui  # Playwright UI mode
```
