import { describe, it, expect, test } from 'vitest'
import { Effect, Either, Layer, Stream } from 'effect'
import * as fc from 'fast-check'
import { ClinicalDataRepositoryService } from './ClinicalDataRepositoriesService'
import { FhirR4ClientService } from './FhirR4ClientService'
import type { FhirR4Client } from '@assessmentis/fhir-client'

describe('ClinicalDataRepositoryService', () => {
  const mockFhirClient = {} as typeof FhirR4Client.Service

  const createMockFhirR4ClientService =
    (): typeof FhirR4ClientService.Service => ({
      client: Effect.succeed(mockFhirClient),
      clientStream: Stream.succeed(Either.right(mockFhirClient)),
      shutdown: Effect.void,
    })

  const resourceTypes = [
    'Composition',
    'Encounter',
    'Media',
    'Observation',
    'Patient',
    'Practitioner',
    'Questionnaire',
    'QuestionnaireResponse',
  ] as const

  const repositoryMethods = [
    'get',
    'getMany',
    'create',
    'update',
    'delete',
    'createMany',
  ] as const

  describe('Service provides repository for each resource type', () => {
    test.each(resourceTypes)(
      'provides %s repository as Effect',
      async (resourceType) => {
        const mockClientService = createMockFhirR4ClientService()

        const program = Effect.gen(function* () {
          const service = yield* ClinicalDataRepositoryService
          expect(service.effect[resourceType]).toBeDefined()
          expect(Effect.isEffect(service.effect[resourceType])).toBe(true)
        }).pipe(
          Effect.provide(
            ClinicalDataRepositoryService.Default.pipe(
              Layer.provide(
                Layer.succeed(FhirR4ClientService, mockClientService)
              )
            )
          )
        )

        await Effect.runPromise(program)
      }
    )
  })

  describe('repositoryEffect', () => {
    it('property: returns repository with all required methods for any resource type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...resourceTypes),
          async (resourceType) => {
            const mockClientService = createMockFhirR4ClientService()

            const program = Effect.gen(function* () {
              const service = yield* ClinicalDataRepositoryService
              const repo = yield* service.repositoryEffect<any>(resourceType)

              expect(repo).toBeDefined()
              repositoryMethods.forEach((method) => {
                expect(repo).toHaveProperty(method)
              })
            }).pipe(
              Effect.provide(
                ClinicalDataRepositoryService.Default.pipe(
                  Layer.provide(
                    Layer.succeed(FhirR4ClientService, mockClientService)
                  )
                )
              )
            )

            await Effect.runPromise(program)
          }
        )
      )
    })
  })

  describe('Service integration', () => {
    it('property: provides all repositories and handles client failures gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async (shouldFail) => {
          const mockClientService: typeof FhirR4ClientService.Service = {
            client: shouldFail
              ? Effect.fail(new Error('Client unavailable') as any)
              : Effect.succeed(mockFhirClient),
            clientStream: shouldFail
              ? Stream.succeed(
                  Either.left(new Error('Client unavailable') as any)
                )
              : Stream.succeed(Either.right(mockFhirClient)),
            shutdown: Effect.void,
          }

          const program = Effect.gen(function* () {
            const service = yield* ClinicalDataRepositoryService

            expect(service).toBeDefined()
            expect(ClinicalDataRepositoryService.key).toBe(
              'ClinicalDataRepositoryService'
            )

            // All repositories should exist regardless of client state
            resourceTypes.forEach((type) => {
              expect(service.effect[type]).toBeDefined()
            })
          }).pipe(
            Effect.provide(
              ClinicalDataRepositoryService.Default.pipe(
                Layer.provide(
                  Layer.succeed(FhirR4ClientService, mockClientService)
                )
              )
            )
          )

          await Effect.runPromise(program)
        })
      )
    })
  })
})
