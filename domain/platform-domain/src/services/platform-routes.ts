import { Context } from 'effect'

import type { PlatformRoutesService } from '../models/platform-urls'

/**
 * Effect context tag for accessing the platform routing service.
 *
 * @remarks
 * Infrastructure provides the concrete implementation (e.g.
 * {@link @assessmentis/firebase-domain!FirebasePlatformRoutes}).
 * Domain code depends on this tag to build and parse resource URLs
 * without knowing which storage backend is in use.
 */
class PlatformRoutes extends Context.Tag('PlatformRoutes')<
  PlatformRoutes,
  PlatformRoutesService
>() {}

export { PlatformRoutes }
