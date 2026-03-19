import { Context } from 'effect'

import type { Hub } from '@assessmentis/effectful-store'

import type { ClinicalDomainClasses } from './resource-data-types'

/**
 * ClinicalDomainHub provides centralized access to all clinical domain resources
 * (Patient, Encounter, Questionnaire, etc.) via a unified Hub interface.
 *
 * The Hub pattern replaces individual repository services with a single
 * service that handles:
 * - Resource retrieval (get, search)
 * - Resource mutations (create, update, delete)
 * - Reactive subscriptions (subscribe, subscribeSearch)
 * - Multi-origin routing and request resolution
 *
 * @example Basic usage with generic methods
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const hub = yield* ClinicalDomainHub
 *
 *   // Fetch a patient
 *   const patient = yield* hub.get(Patient, patientUrl)
 *
 *   // Search for encounters
 *   const encounters = yield* hub.search(Encounter, { patient: patientUrl })
 *
 *   // Create a new observation
 *   const obs = yield* hub.create(Observation, newObservation)
 * })
 * ```
 *
 *
 * @example Reactive subscriptions
 * ```typescript
 * // Subscribe to resource changes
 * const patientStream = hub.subscribe(Patient, patientUrl)
 * // Returns: Stream<Either<Patient, NotFoundError | CommonErrors>>
 *
 * // Subscribe to search results
 * const encountersStream = hub.subscribeSearch(Encounter, { patient: patientUrl })
 * // Returns: Stream<Either<Encounter[], CommonErrors>>
 * ```
 *
 * @see {@link Hub} for full API documentation
 * @see ClinicalDomainClasses for available resource types
 */
export class ClinicalDomainHub extends Context.Tag('ClinicalDomainHub')<
  ClinicalDomainHub,
  Hub.Hub<ClinicalDomainClasses>
>() {}
