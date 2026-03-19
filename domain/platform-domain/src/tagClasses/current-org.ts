import { Context } from 'effect'

import type { OrgSlug } from '../models/id-types'

/**
 * Effect context tag carrying the currently selected {@link OrgSlug}.
 *
 * @remarks
 * Provided by `OrgContextProvider` on the client and by request middleware
 * on the server. Domain code that needs the active org depends on this tag
 * rather than accepting the slug as a parameter.
 */
export class CurrentOrg extends Context.Tag('CurrentOrg')<CurrentOrg, OrgSlug>() {}
