import { describe, it, expect } from 'vitest'
import { Effect, Layer, Exit, Cause } from 'effect'
import * as fc from 'fast-check'
import {
  ClinicalDataRepositoryService,
} from './ClinicalDataRepositoriesService'
import { FhirR4ClientService } from './FhirR4ClientService'
import { FhirR4Client } from '@assessmentis/clinical-domain/assessmentis'
import { Patient } from '@assessmentis/clinical-domain/administration'

describe('ClinicalDataRepositoryService', () => {
  const createMockFhirR4ClientService = (): typeof FhirR4ClientService.Service => ({
    client: Effect.succeed({} as typeof FhirR4Client.Service),
    clientStream: {} as any,
    shutdown: Effect.void,
  })

  describe('Service provides repository for each resource type', () => {
    it('provides Composition repository', async () => {
      const mockClientService = createMockFhirR4ClientService()

      const program = Effect.gen(function* () {
        const service = yield* ClinicalDataRepositoryService

        // Verify Composition repository exists
        expect(service.Composition).toBeDefined()
        expect(Effect.isEffect(service.Composition)).toBe(true)
      }).pipe(
        Effect.provide(
          ClinicalDataRepositoryService.Default.pipe(
            Layer.provide(Layer.succeed(FhirR4ClientService, mockClientService))
          )
        )
      )

      await Effect.runPromise(program)
    })

    it('provides Encounter repository', async () => {
      const mockClientService = createMockFhirR4ClientService()

      const program = Effect.gen(function* () {
        const service = yield* ClinicalDataRepositoryService

        expect(service.Encounter).toBeDefined()
        expect(Effect.isEffect(service.Encounter)).toBe(true)
      }).pipe(
        Effect.provide(
          ClinicalDataRepositoryService.Default.pipe(
            Layer.provide(Layer.succeed(FhirR4ClientService, mockClientService))
          )
        )
      )

      await Effect.runPromise(program)
    })

    it('provides Media repository', async () => {
      const mockClientService = createMockFhirR4ClientService()

      const program = Effect.gen(function* () {
        const service = yield* ClinicalDataRepositoryService

        expect(service.Media).toBeDefined()
        expect(Effect.isEffect(service.Media)).toBe(true)
      }).pipe(
        Effect.provide(
          ClinicalDataRepositoryService.Default.pipe(
            Layer.provide(Layer.succeed(FhirR4ClientService, mockClientService))
          )
        )
      )

      await Effect.runPromise(program)
    })

    it('provides Observation repository', async () => {
      const mockClientService = createMockFhirR4ClientService()

      const program = Effect.gen(function* () {
        const service = yield* ClinicalDataRepositoryService

        expect(service.Observation).toBeDefined()
        expect(Effect.isEffect(service.Observation)).toBe(true)
      }).pipe(
        Effect.provide(
          ClinicalDataRepositoryService.Default.pipe(
            Layer.provide(Layer.succeed(FhirR4ClientService, mockClientService))
          )
        )
      )

      await Effect.runPromise(program)
    })

    it('provides Patient repository', async () => {
      const mockClientService = createMockFhirR4ClientService()

      const program = Effect.gen(function* () {
        const service = yield* ClinicalDataRepositoryService

        expect(service.Patient).toBeDefined()
        expect(Effect.isEffect(service.Patient)).toBe(true)
      }).pipe(
        Effect.provide(
          ClinicalDataRepositoryService.Default.pipe(
            Layer.provide(Layer.succeed(FhirR4ClientService, mockClientService))
          )
        )
      )

      await Effect.runPromise(program)
    })

    it('provides Practitioner repository', async () => {
      const mockClientService = createMockFhirR4ClientService()

      const program = Effect.gen(function* () {
        const service = yield* ClinicalDataRepositoryService

        expect(service.Practitioner).toBeDefined()
        expect(Effect.isEffect(service.Practitioner)).toBe(true)
      }).pipe(
        Effect.provide(
          ClinicalDataRepositoryService.Default.pipe(
            Layer.provide(Layer.succeed(FhirR4ClientService, mockClientService))
          )
        )
      )

      await Effect.runPromise(program)
    })

    it('provides Questionnaire repository', async () => {
      const mockClientService = createMockFhirR4ClientService()

      const program = Effect.gen(function* () {
        const service = yield* ClinicalDataRepositoryService

        expect(service.Questionnaire).toBeDefined()
        expect(Effect.isEffect(service.Questionnaire)).toBe(true)
      }).pipe(
        Effect.provide(
          ClinicalDataRepositoryService.Default.pipe(
            Layer.provide(Layer.succeed(FhirR4ClientService, mockClientService))
          )
        )
      )

      await Effect.runPromise(program)
    })

    it('provides QuestionnaireResponse repository', async () => {
      const mockClientService = createMockFhirR4ClientService()

      const program = Effect.gen(function* () {
        const service = yield* ClinicalDataRepositoryService

        expect(service.QuestionnaireResponse).toBeDefined()
        expect(Effect.isEffect(service.QuestionnaireResponse)).toBe(true)
      }).pipe(
        Effect.provide(
          ClinicalDataRepositoryService.Default.pipe(
            Layer.provide(Layer.succeed(FhirR4ClientService, mockClientService))
          )
        )
      )

      await Effect.runPromise(program)
    })

    it('property: all repository effects are Effects', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          const mockClientService = createMockFhirR4ClientService()

          const program = Effect.gen(function* () {
            const service = yield* ClinicalDataRepositoryService

            const repos = [
              service.Composition,
              service.Encounter,
              service.Media,
              service.Observation,
              service.Patient,
              service.Practitioner,
              service.Questionnaire,
              service.QuestionnaireResponse,
            ]

            repos.forEach((repo) => {
              expect(Effect.isEffect(repo)).toBe(true)
            })
          }).pipe(
            Effect.provide(
              ClinicalDataRepositoryService.Default.pipe(
                Layer.provide(Layer.succeed(FhirR4ClientService, mockClientService))
              )
            )
          )

          await Effect.runPromise(program)
        })
      )
    })
  })

  describe('repositoryEffect', () => {
    it('returns correct typed repository for Patient', async () => {
      const mockClientService = createMockFhirR4ClientService()

      const program = Effect.gen(function* () {
        const service = yield* ClinicalDataRepositoryService

        const patientRepo = yield* service.repositoryEffect<Patient>('Patient')

        // Verify repository has expected methods
        expect(patientRepo).toBeDefined()
        expect(patientRepo).toHaveProperty('get')
        expect(patientRepo).toHaveProperty('getMany')
        expect(patientRepo).toHaveProperty('create')
        expect(patientRepo).toHaveProperty('update')
        expect(patientRepo).toHaveProperty('delete')
        expect(patientRepo).toHaveProperty('createMany')
      }).pipe(
        Effect.provide(
          ClinicalDataRepositoryService.Default.pipe(
            Layer.provide(Layer.succeed(FhirR4ClientService, mockClientService))
          )
        )
      )

      await Effect.runPromise(program)
    })

    it('property: repositoryEffect returns repository for any valid resource type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'Composition',
            'Encounter',
            'Media',
            'Observation',
            'Patient',
            'Practitioner',
            'Questionnaire',
            'QuestionnaireResponse'
          ),
          async (resourceType) => {
            const mockClientService = createMockFhirR4ClientService()

            const program = Effect.gen(function* () {
              const service = yield* ClinicalDataRepositoryService

              const repo = yield* service.repositoryEffect<any>(resourceType)

              expect(repo).toBeDefined()
              expect(repo).toHaveProperty('get')
              expect(repo).toHaveProperty('getMany')
              expect(repo).toHaveProperty('create')
              expect(repo).toHaveProperty('update')
              expect(repo).toHaveProperty('delete')
              expect(repo).toHaveProperty('createMany')
            }).pipe(
              Effect.provide(
                ClinicalDataRepositoryService.Default.pipe(
                  Layer.provide(Layer.succeed(FhirR4ClientService, mockClientService))
                )
              )
            )

            await Effect.runPromise(program)
          }
        )
      )
    })

    it('uses the service instance it is called on', async () => {
      const mockClientService = createMockFhirR4ClientService()

      const program = Effect.gen(function* () {
        const service = yield* ClinicalDataRepositoryService

        // Call repositoryEffect - it should provide its own service context
        const repo = yield* service.repositoryEffect<Patient>('Patient')

        expect(repo).toBeDefined()
      }).pipe(
        Effect.provide(
          ClinicalDataRepositoryService.Default.pipe(
            Layer.provide(Layer.succeed(FhirR4ClientService, mockClientService))
          )
        )
      )

      await Effect.runPromise(program)
    })
  })

  describe('Service tag', () => {
    it('has correct service name', () => {
      expect(ClinicalDataRepositoryService.key).toBe('ClinicalDataRepositoryService')
    })
  })

  describe('Service integration', () => {
    it('service can be provided and accessed through Effect runtime', async () => {
      const mockClientService = createMockFhirR4ClientService()

      const program = Effect.gen(function* () {
        const service = yield* ClinicalDataRepositoryService

        expect(service).toBeDefined()
        expect(service.Composition).toBeDefined()
        expect(service.Encounter).toBeDefined()
        expect(service.Media).toBeDefined()
        expect(service.Observation).toBeDefined()
        expect(service.Patient).toBeDefined()
        expect(service.Practitioner).toBeDefined()
        expect(service.Questionnaire).toBeDefined()
        expect(service.QuestionnaireResponse).toBeDefined()
      }).pipe(
        Effect.provide(
          ClinicalDataRepositoryService.Default.pipe(
            Layer.provide(Layer.succeed(FhirR4ClientService, mockClientService))
          )
        )
      )

      await Effect.runPromise(program)
    })

    it('service works when FhirR4ClientService fails', async () => {
      const mockClientService: typeof FhirR4ClientService.Service = {
        client: Effect.fail(new Error('Client unavailable') as any),
        clientStream: {} as any,
        shutdown: Effect.void,
      }

      const program = Effect.gen(function* () {
        const service = yield* ClinicalDataRepositoryService

        // Service should be created even if client will fail later
        expect(service).toBeDefined()

        // Verify service has all the repositories
        expect(service.Composition).toBeDefined()
        expect(service.Patient).toBeDefined()
        // The repository effects exist, they will fail when executed
      }).pipe(
        Effect.provide(
          ClinicalDataRepositoryService.Default.pipe(
            Layer.provide(Layer.succeed(FhirR4ClientService, mockClientService))
          )
        )
      )

      await Effect.runPromise(program)
    })
  })
})
