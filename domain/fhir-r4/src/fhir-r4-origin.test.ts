import { Cause, Effect, Exit, Option, Request } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test, vi } from 'vitest'

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
import { ReadonlyUrl, Search } from '@assessmentis/effectful-store'
import type { ResourceRequest } from '@assessmentis/effectful-store'
import { stringConditionArb } from '@assessmentis/effectful-store/test'
import { NotFoundError } from '@assessmentis/ontology'

import { makeFhirR4ReadyOrigin } from './fhir-r4-origin'
import { FhirR4Client } from './FhirR4Client/fhir-r4-client'

// --- Helpers ---

const originUrl = ReadonlyUrl.make({
  host: 'fhir.example.com',
  pathname: '/fhir',
  protocol: 'http:',
})

/** Arbitrary FHIR-style id (alphanumeric + hyphens) */
const fhirIdArb = fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,63}$/).filter((s) => s.length > 0)

/** Arbitrary search params: 0–3 key/value pairs with SearchCondition values */
const searchParamsArb = fc.dictionary(
  fc.stringMatching(/^[a-z][a-zA-Z]{0,9}$/),
  stringConditionArb,
  { maxKeys: 3, minKeys: 0 }
)

const minimalFhirPatient = (id: string) => ({
  id,
  resourceType: 'Patient' as const,
})

const searchBundle = (...ids: string[]) => ({
  entry: ids.map((id) => ({ resource: minimalFhirPatient(id) })),
  resourceType: 'Bundle' as const,
  type: 'searchset' as const,
})

const makeMockClient = (overrides: Partial<FhirR4Client['Type']> = {}): FhirR4Client['Type'] => ({
  create: vi.fn(() => Effect.succeed({})),
  delete: vi.fn(() => Effect.void),
  executeBundle: vi.fn(() => Effect.succeed({})),
  read: vi.fn(() => Effect.succeed({})),
  search: vi.fn(() => Effect.succeed({})),
  update: vi.fn(() => Effect.succeed({})),
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
    origin: originUrl,
    url: Patient.UrlSchema.make(originUrl.appendToPathname(`/Patient/${id}`)),
  })

const makeSearchRequest = (params: Search.QueryFor<typeof Patient> = {}) =>
  Request.of<ResourceRequest.Search<typeof Patient>>()({
    _tag: 'Search',
    klass: Patient,
    origin: originUrl,
    params,
  })

const makeDeleteRequest = (id: string) =>
  Request.of<ResourceRequest.Delete<typeof Patient>>()({
    _tag: 'Delete',
    klass: Patient,
    origin: originUrl,
    resource: {
      url: Patient.UrlSchema.make(originUrl.appendToPathname(`/Patient/${id}`)),
    },
  })

// --- Tests ---

describe('FhirR4Origin', () => {
  describe('Get', () => {
    test('extracts FHIR id from URL and forwards to client.read', () => {
      fc.assert(
        fc.property(fhirIdArb, (id) => {
          const readFn = vi.fn(() => Effect.succeed(minimalFhirPatient(id)))
          const { origin } = makeOrigin({ read: readFn })

          const result = Effect.runSync(Effect.request(makeGetRequest(id), origin.resolver))

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
                params: {
                  id,
                },
                resourceType: 'Patient',
              })
            )
          )
          const { origin } = makeOrigin({ read: readFn })

          const exit = Effect.runSyncExit(Effect.request(makeGetRequest(id), origin.resolver))

          expect(Exit.isFailure(exit)).toBe(true)
          if (Exit.isFailure(exit)) {
            const error = Option.getOrThrow(
              // oxlint-disable-next-line unicorn/no-array-callback-reference -- false positive: Option.flatMap is not an array method
              Option.flatMap(Exit.causeOption(exit), (cause) => Cause.failureOption(cause))
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
          fc.array(fhirIdArb, { maxLength: 5, minLength: 0 }),
          (params, ids) => {
            const searchFn = vi.fn(() => Effect.succeed(searchBundle(...ids)))
            const { origin } = makeOrigin({ search: searchFn })

            const results = Effect.runSync(
              Effect.request(makeSearchRequest(params), origin.resolver)
            )

            // Verify params were serialized correctly
            const expectedFlat: Record<string, string | readonly string[]> = {}
            for (const [key, condition] of Object.entries(params)) {
              expectedFlat[key] = Search.Condition.match(condition, {
                Exactly: ({ value }) => String(value),
                AnyOf: ({ values }) => values.map(String),
              })
            }
            expect(searchFn).toHaveBeenCalledWith(
              expect.objectContaining({ domainType: 'Patient', ...expectedFlat })
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
          entry: [],
          resourceType: 'Bundle' as const,
          type: 'searchset' as const,
        })
      )
      const { origin } = makeOrigin({ search: searchFn })

      const results = Effect.runSync(Effect.request(makeSearchRequest(), origin.resolver))
      expect(results).toHaveLength(0)
    })
  })

  describe('Delete', () => {
    test('extracts id and calls client.delete, returns null', () => {
      fc.assert(
        fc.property(fhirIdArb, (id) => {
          const deleteFn = vi.fn(() => Effect.succeed(undefined as void))
          const { origin } = makeOrigin({ delete: deleteFn })

          const result = Effect.runSync(Effect.request(makeDeleteRequest(id), origin.resolver))

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
