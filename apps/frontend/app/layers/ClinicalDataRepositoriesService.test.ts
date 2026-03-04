import * as fc from 'fast-check'
import { describe, expect, it, test } from 'vitest'
import { Effect, Either, Layer, Stream } from 'effect'

import { UnhandledError } from '@assessmentis/ontology'

import type { FhirR4Client } from '../../../../domain/fhir-r4/src'
import { ClinicalDataRepositoryService } from './ClinicalDataRepositoriesService'
import { FhirR4ClientService } from './FhirR4ClientService'

describe('ClinicalDataRepositoryService', () => {
  const mockFhirClient = {} as typeof FhirR4Client.Service

  const createMockFhirR4ClientService =
    (): typeof FhirR4ClientService.Service => ({
      client: Effect.succeed(mockFhirClient),
      clientStream: Stream.succeed(Either.right(mockFhirClient)),
      shutdown: Effect.void,
    })

  const clinicalResourceTypes = [
    'Composition',
    'Encounter',
    'Location',
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
  ] as const

  describe('Service provides repository for each resource type', () => {
    test.each(clinicalResourceTypes)(
      'provides %s repository as Effect',
      async (clinicalResourceType) => {
        const mockClientService = createMockFhirR4ClientService()

        const program = Effect.gen(function* () {
          const service = yield* ClinicalDataRepositoryService
          expect(service.effect[clinicalResourceType]).toBeDefined()
          expect(Effect.isEffect(service.effect[clinicalResourceType])).toBe(
            true
          )
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
    it.fails(
      'property: returns repository with all required methods for any resource type',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.constantFrom(...clinicalResourceTypes),
            async (clinicalResourceType) => {
              const mockClientService = createMockFhirR4ClientService()

              const program = Effect.gen(function* () {
                const service = yield* ClinicalDataRepositoryService
                const repo =
                  yield* service.repositoryEffect<any>(clinicalResourceType)

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
      }
    )
  })

  describe('Service integration', () => {
    it('property: provides all repositories and handles client failures gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async (shouldFail) => {
          const mockClientService: typeof FhirR4ClientService.Service = {
            client: shouldFail
              ? Effect.fail(
                  new UnhandledError({ message: 'Client unavailable' })
                )
              : Effect.succeed(mockFhirClient),
            clientStream: shouldFail
              ? Stream.succeed(
                  Either.left(
                    new UnhandledError({ message: 'Client unavailable' })
                  )
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
            clinicalResourceTypes.forEach((type) => {
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
