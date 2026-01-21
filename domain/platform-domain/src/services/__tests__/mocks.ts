import { vi, type Mock } from 'vitest'
import { Effect, Layer, Stream, Context } from 'effect'
import { DocumentStore } from '../../tagClasses'
import { NotFoundError } from '@assessmentis/ontology'
import type { OrgSlug } from '../../models/IdTypes'
import type { UserId } from '../../models/UserId'

/**
 * Create a mock DocumentStore for testing
 * 
 * @param config - Configuration for the mock behavior
 * @returns A Layer providing the mocked DocumentStore
 */
export function createMockDocumentStore(config: {
  /**
   * Map of path keys to data responses
   * Key format: "collection/id" (e.g., "orgs/test-org", "users/user-123")
   */
  data?: Map<string, any>
  /**
   * Custom get function for more complex mocking scenarios
   */
  customGet?: (...path: readonly string[]) => Effect.Effect<any, NotFoundError, never>
}): {
  layer: Layer.Layer<DocumentStore, never, never>
  getMock: Mock
} {
  const getMock = vi.fn()
  
  const get = ((...path: readonly string[]) => {
    getMock(...path)
    
    if (config.customGet) {
      return config.customGet(...path)
    }
    
    if (config.data) {
      const key = path.join('/')
      const data = config.data.get(key)
      
      if (data !== undefined) {
        return Effect.succeed(data as any)
      }
    }
    
    return Effect.fail(
      new NotFoundError({
        resourceType: path[0],
        params: { path: path.join('/') },
      })
    )
  }) as Context.Tag.Service<typeof DocumentStore>['get']

  const mockLayer = Layer.succeed(DocumentStore, {
    get,
    subscribeTo: () => Stream.never,
  })

  return {
    layer: mockLayer,
    getMock,
  }
}

/**
 * Create mock org data for testing
 */
export function createMockOrgData(orgSlug: string | OrgSlug) {
  return {
    slug: typeof orgSlug === 'string' ? orgSlug : orgSlug,
    frontendConfig: {
      fhirServer: {
        _tag: 'not_implemented' as const,
      },
      videoCallClient: {
        _tag: 'not_implemented' as const,
      },
    },
  }
}

/**
 * Create mock user data for testing
 */
export function createMockUserData(userId: string | UserId, orgRoles: Record<string, string[]> = {}) {
  return {
    uid: typeof userId === 'string' ? userId : userId,
    org_roles: orgRoles,
  }
}

/**
 * Create mock user org roles data for testing
 */
export function createMockUserOrgRoles(roles: string[]) {
  return {
    roles,
  }
}
