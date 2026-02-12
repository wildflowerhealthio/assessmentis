# React Router Data APIs Reference

This reference describes how route modules use React Router v7 data APIs in this app.

## Route module structure

- Route files live under app/routes/ and are typed using the generated Route types.
- Prefer clientLoader/clientAction for browser-only data access in this SPA.
- Use Effect.runPromise to bridge Effect workflows into loader/action async functions.
- Use Form and loaderData from Route.ComponentProps for actions and data.

## Common patterns

- Use DocumentStore and other services through Effect layers inside loaders/actions.
- Use Effect.catchTag to normalize NotFoundError and other expected cases.
- Avoid component-side SDK usage when a loader/action can centralize the Effect workflow.
- Keep route modules thin by delegating logic to domain or layer services.

## Most-used code locations

- Example route module: [orgs.$orgSlug.tsx](orgs.$orgSlug.tsx)
- Route type generation: [../../react-router.config.ts](../../react-router.config.ts)
- Route components root: [.](.)
