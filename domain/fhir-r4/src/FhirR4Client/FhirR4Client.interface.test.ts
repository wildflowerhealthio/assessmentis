import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
} from 'vitest'
import type { SuiteCollector, SuiteFactory } from 'vitest'
import { it } from '@effect/vitest'
import { Cause, Console, Effect, Exit, Option, pipe } from 'effect'
import type { Layer } from 'effect'

import { FhirR4Client } from './FhirR4Client'

/**
 * Test case configuration for FHIR R4 resource CRUD operations.
 * All fields are required - consumers must provide test cases for each operation.
 */
export interface FhirR4ResourceCases {
  /** ID that is known not to exist (for NotFoundError tests) */
  nonExistentResourceId?: string

  /** Test cases for create-then-read operations */
  createAndRead: {
    /** Array of resources to create (each becomes a test case) */
    cases: { name: string; resource: unknown }[]
    /**
     * Assertion function called with the created resource and the read-back resource.
     * Should throw on failure (use expect internally).
     */
    assertion: (input: unknown, output: unknown) => void
  }

  /** Test cases for update-then-read operations */
  updateAndRead: {
    /** Initial resource to create before update */
    initial: unknown
    /** Array of updates to apply (each becomes a test case) */
    cases: { name: string; update: unknown }[]
    /**
     * Assertion function called with before state, update response, and read-back.
     * Should throw on failure.
     */
    assertion: (before: unknown, updateResponse: unknown, read: unknown) => void
  }

  /** Test cases for create-delete-read operations */
  createDeleteRead: {
    /** Array of resources to create then delete */
    cases: { name: string; resource: unknown }[]
    /**
     * Assertion function called with original resource, delete result, and read exit.
     * readError is the Exit from attempting to read after delete.
     */
    assertion: (
      resource: unknown,
      deleteResult: void,
      readError: Exit.Exit<unknown, unknown>
    ) => void
  }

  /** Test cases for search operations */
  createManyAndSearch: {
    /** Resources to create before running search cases */
    toCreate: unknown[]
    /** Array of search scenarios (each creates fresh data) */
    cases: {
      name: string
      /** Search parameters to use */
      params: Record<string, string | readonly string[] | undefined>
      /** Assertion function called with search result Bundle */
      assertion: (result: unknown) => void
    }[]
  }
}

/**
 * Creates a describe block that tests FhirR4Client compliance for a given resource type.
 */
export const describeAsFhirR4ResourceClient = (
  FhirR4ClientLayer: Layer.Layer<FhirR4Client, never, never>,
  resourceType: string,
  cases: FhirR4ResourceCases,
  fn?: SuiteFactory<object>
): SuiteCollector<object> => {
  return describe(`complies with FhirR4Client interface for ${resourceType}`, (testApi) => {
    fn?.(testApi)

    // Internal resource tracking for cleanup
    let resourcesToDelete: Array<{ type: string; id: string }> = []

    const trackForCleanup = (type: string, id: string) => {
      resourcesToDelete.push({ type, id })
    }

    beforeEach(() => {
      resourcesToDelete = []
    })

    afterEach(() =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* FhirR4Client
          for (const { type, id } of resourcesToDelete) {
            const exit = yield* Effect.exit(
              client.delete({ domainType: type, id })
            )
            if (Exit.isFailure(exit)) {
              yield* Console.warn(
                `Failed to delete ${type}/${id} during cleanup`
              )
            }
          }
        }).pipe(Effect.provide(FhirR4ClientLayer))
      )
    )

    describe('read (not found)', () => {
      it.effect('should return NotFoundError for non-existent resource', () =>
        Effect.gen(function* () {
          const client = yield* FhirR4Client
          const exit = yield* Effect.exit(
            client.read({
              domainType: resourceType,
              id:
                cases.nonExistentResourceId ??
                '9a027c58-305f-4d5c-ad19-59654b8e436b',
            })
          )

          expect(Exit.isFailure(exit)).toBe(true)
          if (Exit.isFailure(exit)) {
            const error = pipe(
              exit,
              Exit.causeOption,
              Option.flatMap(Cause.failureOption),
              Option.getOrThrow
            )
            expect((error as { _tag: string })._tag).toBe('NotFoundError')
          }
        }).pipe(Effect.provide(FhirR4ClientLayer))
      )
    })

    describe('createAndRead', () => {
      it.effect.each(cases.createAndRead.cases)(
        'should create and read back $name',
        (testCase) =>
          Effect.gen(function* () {
            const client = yield* FhirR4Client

            // Create
            const created = yield* client.create({
              domainType: resourceType,
              resource: testCase.resource,
            })
            const createdResource = created as { id: string }
            trackForCleanup(resourceType, createdResource.id)

            // Read back
            const readBack = yield* client.read({
              domainType: resourceType,
              id: createdResource.id,
            })

            // Custom assertion
            cases.createAndRead.assertion(testCase.resource, readBack)
          }).pipe(Effect.provide(FhirR4ClientLayer))
      )
    })

    describe('updateAndRead', () => {
      it.effect.each(cases.updateAndRead.cases)(
        `should update and read back $name`,
        (testCase) =>
          Effect.gen(function* () {
            const client = yield* FhirR4Client

            // Create initial
            const created = yield* client.create({
              domainType: resourceType,
              resource: cases.updateAndRead.initial,
            })
            const before = created as { id: string }
            trackForCleanup(resourceType, before.id)

            // Update
            const updateResponse = yield* client.update({
              domainType: resourceType,
              id: before.id,
              resource: { ...(testCase.update as object), id: before.id },
            })

            // Read back
            const readBack = yield* client.read({
              domainType: resourceType,
              id: before.id,
            })

            // Custom assertion
            cases.updateAndRead.assertion(before, updateResponse, readBack)
          }).pipe(Effect.provide(FhirR4ClientLayer))
      )
    })

    describe('createDeleteRead', () => {
      it.effect.each(cases.createDeleteRead.cases)(
        `should delete $name and verify not found`,
        (testCase) =>
          Effect.gen(function* () {
            const client = yield* FhirR4Client

            // Create
            const created = yield* client.create({
              domainType: resourceType,
              resource: testCase.resource,
            })
            const createdResource = created as { id: string }
            // Don't track - we're deleting it

            // Delete
            const deleteResult = yield* client.delete({
              domainType: resourceType,
              id: createdResource.id,
            })

            // Attempt read (should fail)
            const readExit = yield* Effect.exit(
              client.read({ domainType: resourceType, id: createdResource.id })
            )

            // Custom assertion
            cases.createDeleteRead.assertion(
              testCase.resource,
              deleteResult,
              readExit
            )
          }).pipe(Effect.provide(FhirR4ClientLayer))
      )
    })

    describe('createManyAndSearch', () => {
      const searchableResourcesToDelete: Array<{ type: string; id: string }> =
        []

      beforeAll(() =>
        Effect.runPromise(
          Effect.gen(function* () {
            const client = yield* FhirR4Client
            // Create all resources fresh for this search case
            for (const resource of cases.createManyAndSearch.toCreate) {
              const created = yield* client.create({
                domainType: resourceType,
                resource,
              })
              const createdResource = created as { id: string }
              searchableResourcesToDelete.push({
                type: resourceType,
                id: createdResource.id,
              })
            }
          }).pipe(Effect.provide(FhirR4ClientLayer))
        )
      )

      afterAll(() =>
        Effect.runPromise(
          Effect.gen(function* () {
            const client = yield* FhirR4Client
            for (const { type, id } of searchableResourcesToDelete) {
              const exit = yield* Effect.exit(
                client.delete({ domainType: type, id })
              )
              if (Exit.isFailure(exit)) {
                yield* Console.warn(
                  `Failed to delete ${type}/${id} during cleanup`
                )
              }
            }
          }).pipe(Effect.provide(FhirR4ClientLayer))
        )
      )

      it.effect.each(cases.createManyAndSearch.cases)(
        `should $name`,
        (searchCase) =>
          Effect.gen(function* () {
            const client = yield* FhirR4Client

            // Search
            const result = yield* client.search({
              domainType: resourceType,
              ...searchCase.params,
            })

            // Custom assertion
            searchCase.assertion(result)
          }).pipe(Effect.provide(FhirR4ClientLayer))
      )
    })
  })
}
