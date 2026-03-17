import * as fc from 'fast-check'
import { describe, expect, test, vi } from 'vitest'
import { Cause, Effect, Exit, Option, Request } from 'effect'

import {
  Composition,
  DiagnosticReport,
  Encounter,
  Location,
  Media,
  Observation,
  Patient,
  Practitioner,
  Questionnaire,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import type { ResourceRequest } from '@assessmentis/effectful-store'
import { NotFoundError } from '@assessmentis/ontology'

import { FhirR4Client } from './FhirR4Client/FhirR4Client'
import { makeFhirR4ReadyOrigin } from './FhirR4Origin'

// --- Helpers ---

const originUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'fhir.example.com',
  pathname: '/fhir',
})

/** Arbitrary FHIR-style id (alphanumeric + hyphens) */
const fhirIdArb = fc
  .stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,63}$/)
  .filter((s) => s.length > 0)

/** Arbitrary search params: 0–3 key/value pairs */
const searchParamsArb = fc.dictionary(
  fc.stringMatching(/^[a-z][a-zA-Z]{0,9}$/),
  fc.string({ minLength: 1, maxLength: 20 }),
  { minKeys: 0, maxKeys: 3 }
)

const minimalFhirPatient = (id: string) => ({
  resourceType: 'Patient' as const,
  id,
})

const searchBundle = (...ids: string[]) => ({
  resourceType: 'Bundle' as const,
  type: 'searchset' as const,
  entry: ids.map((id) => ({ resource: minimalFhirPatient(id) })),
})

const makeMockClient = (
  overrides: Partial<FhirR4Client['Type']> = {}
): FhirR4Client['Type'] => ({
  read: vi.fn(() => Effect.succeed({})),
  search: vi.fn(() => Effect.succeed({})),
  create: vi.fn(() => Effect.succeed({})),
  update: vi.fn(() => Effect.succeed({})),
  delete: vi.fn(() => Effect.succeed(undefined)),
  executeBundle: vi.fn(() => Effect.succeed({})),
  ...overrides,
})

const makeOrigin = (overrides: Partial<FhirR4Client['Type']> = {}) => {
  const client = makeMockClient(overrides)
  const origin = makeFhirR4ReadyOrigin({
    client,
    originUrl,
    provokeReauthenticate: () => Effect.void,
    provokeReauthorize: () => Effect.void,
  })
  return { client, origin }
}

const makeGetRequest = (id: string) =>
  Request.of<ResourceRequest.Get<typeof Patient>>()({
    _tag: 'Get',
    klass: Patient,
    url: Patient.UrlSchema.make(originUrl.appendToPathname(`/Patient/${id}`)),
    origin: originUrl,
  })

const makeSearchRequest = (params: Record<string, string | undefined> = {}) =>
  Request.of<ResourceRequest.Search<typeof Patient>>()({
    _tag: 'Search',
    klass: Patient,
    params,
    origin: originUrl,
  })

const makeDeleteRequest = (id: string) =>
  Request.of<ResourceRequest.Delete<typeof Patient>>()({
    _tag: 'Delete',
    klass: Patient,
    resource: {
      url: Patient.UrlSchema.make(originUrl.appendToPathname(`/Patient/${id}`)),
    },
    origin: originUrl,
  })

// --- Tests ---

describe('FhirR4Origin', () => {
  describe('Get', () => {
    test('extracts FHIR id from URL and forwards to client.read', () => {
      fc.assert(
        fc.property(fhirIdArb, (id) => {
          const readFn = vi.fn(() => Effect.succeed(minimalFhirPatient(id)))
          const { origin } = makeOrigin({ read: readFn })

          const result = Effect.runSync(
            Effect.request(makeGetRequest(id), origin.resolver)
          )

          expect(readFn).toHaveBeenCalledWith(
            expect.objectContaining({ domainType: 'Patient', id })
          )
          expect(result.domainType).toBe('Patient')
          expect(result.url).toBeDefined()
        })
      )
    })

    test('surfaces NotFoundError from client without swallowing it', () => {
      fc.assert(
        fc.property(fhirIdArb, (id) => {
          const readFn = vi.fn(() =>
            Effect.fail(
              new NotFoundError<any, { id: string }>({
                resourceType: 'Patient',
                params: {
                  id,
                },
              })
            )
          )
          const { origin } = makeOrigin({ read: readFn })

          const exit = Effect.runSyncExit(
            Effect.request(makeGetRequest(id), origin.resolver)
          )

          expect(Exit.isFailure(exit)).toBe(true)
          if (Exit.isFailure(exit)) {
            const error = Option.getOrThrow(
              Option.flatMap(Exit.causeOption(exit), Cause.failureOption)
            )
            expect((error as { _tag: string })._tag).toBe('NotFoundError')
          }
        })
      )
    })
  })

  describe('Search', () => {
    test('forwards params to client.search and decodes every entry', () => {
      fc.assert(
        fc.property(
          searchParamsArb,
          fc.array(fhirIdArb, { minLength: 0, maxLength: 5 }),
          (params, ids) => {
            const searchFn = vi.fn(() => Effect.succeed(searchBundle(...ids)))
            const { origin } = makeOrigin({ search: searchFn })

            const results = Effect.runSync(
              Effect.request(makeSearchRequest(params), origin.resolver)
            )

            expect(searchFn).toHaveBeenCalledWith(
              expect.objectContaining({ domainType: 'Patient', ...params })
            )
            expect(results).toHaveLength(ids.length)
            for (const r of results) {
              expect(r.domainType).toBe('Patient')
              expect(r.url).toBeDefined()
            }
          }
        )
      )
    })

    test('empty bundle yields empty array', () => {
      const searchFn = vi.fn(() =>
        Effect.succeed({
          resourceType: 'Bundle' as const,
          type: 'searchset' as const,
          entry: [],
        })
      )
      const { origin } = makeOrigin({ search: searchFn })

      const results = Effect.runSync(
        Effect.request(makeSearchRequest(), origin.resolver)
      )
      expect(results).toHaveLength(0)
    })
  })

  describe('Delete', () => {
    test('extracts id and calls client.delete, returns null', () => {
      fc.assert(
        fc.property(fhirIdArb, (id) => {
          const deleteFn = vi.fn(() => Effect.succeed(undefined as void))
          const { origin } = makeOrigin({ delete: deleteFn })

          const result = Effect.runSync(
            Effect.request(makeDeleteRequest(id), origin.resolver)
          )

          expect(deleteFn).toHaveBeenCalledWith(
            expect.objectContaining({ domainType: 'Patient', id })
          )
          expect(result).toBeNull()
        })
      )
    })
  })

  describe('origin shape', () => {
    test('exposes all expected resource types', () => {
      const { origin } = makeOrigin()

      expect(origin.supportedResources).toEqual({
        Composition,
        DiagnosticReport,
        Encounter,
        Location,
        Media,
        Observation,
        Patient,
        Practitioner,
        Questionnaire,
        QuestionnaireResponse,
      })
    })

    test('preserves originUrl and has no errorStatus', () => {
      const { origin } = makeOrigin()
      expect(origin.originUrl).toBe(originUrl)
      expect(origin.errorStatus).toBeUndefined()
    })
  })
})
