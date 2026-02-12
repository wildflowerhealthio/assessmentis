# Cloud Functions How-To

How to add and deploy Firebase Cloud Functions. For architecture context, see [Architecture Explanation](../docs/Architecture/Explanation.md).

## Add a New Function

1. Create a file in `apps/functions/src/`
2. Export the function using Firebase v2 API:

```typescript
import { onRequest } from 'firebase-functions/v2/https'
import { Effect } from 'effect'

export const myFunction = onRequest(
  { region: 'northamerica-northeast2' },
  async (request, response) => {
    const program = Effect.gen(function* () {
      // Use domain repositories via Layers
    })
    const result = await Effect.runPromise(program)
    response.json(result)
  }
)
```

1. Add to `firebase.json` if needed
2. Test locally: `firebase emulators:start --only functions`
3. Deploy: `firebase deploy --only functions:myFunction`

## Commands

```bash
cd apps/functions
npm run build                                    # TypeScript compilation
firebase emulators:start --only functions        # Local emulator
firebase deploy --only functions                 # Deploy all
firebase deploy --only functions:functionName    # Deploy one
```

## Environment Config

- Firebase Functions config + environment variables
- Effect-TS `Config` for type-safe access
- Frontend uses `.env` files (Vite)
