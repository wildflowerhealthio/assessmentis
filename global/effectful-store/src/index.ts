/**
 * Multi-origin resource store built on Effect. Provides CRUD operations,
 * subscriptions, and batched request resolution across multiple data origins.
 *
 * @packageDocumentation
 */

export * as Hub from './Hub'
export * from './ReadonlyUrl'
export * as Resource from './Resource'
// TODO: Eliminate the need for this export
export type { WithId } from './Resource'
export * as ResourceRequest from './ResourceRequest'
export * as Origin from './Origin'
