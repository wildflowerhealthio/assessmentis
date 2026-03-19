/**
 * Multi-origin resource store built on Effect. Provides CRUD operations,
 * subscriptions, and batched request resolution across multiple data origins.
 *
 * @packageDocumentation
 */

export * as Hub from './hub'
export * from './readonly-url'
export * as Resource from './resource'
// TODO: Eliminate the need for this export
export type { WithId } from './resource'
export * as ResourceRequest from './resource-request'
export * as Origin from './origin'
export * from './hub-state-stream'
