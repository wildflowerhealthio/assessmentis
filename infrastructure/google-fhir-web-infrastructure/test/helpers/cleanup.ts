import { Effect } from 'effect'
import { FhirR4Client } from '@assessmentis/fhir-r4'

export interface TrackedResource {
  type: string
  id: string
}

/**
 * TestResourceTracker tracks resources created during tests
 * and provides cleanup functionality.
 */
export class TestResourceTracker {
  private resources: TrackedResource[] = []

  /**
   * Track a resource for cleanup
   */
  track(type: string, id: string): void {
    this.resources.push({ type, id })
  }

  /**
   * Track a resource from a response that has an id property
   */
  trackFromResponse(type: string, response: unknown): void {
    if (
      response &&
      typeof response === 'object' &&
      'id' in response &&
      typeof response.id === 'string'
    ) {
      this.track(type, response.id)
    }
  }

  /**
   * Create cleanup effect that deletes all tracked resources
   */
  cleanup(): Effect.Effect<void, never, FhirR4Client> {
    return Effect.gen(this, function* () {
      if (this.resources.length === 0) return

      const client = yield* FhirR4Client

      for (const { type, id } of this.resources) {
        yield* client
          .delete({ domainType: type, id })
          .pipe(Effect.catchAll(() => Effect.succeed(void 0)))
      }

      this.resources = []
    })
  }

  /**
   * Get count of tracked resources
   */
  get count(): number {
    return this.resources.length
  }

  /**
   * Clear tracking without cleanup
   */
  clear(): void {
    this.resources = []
  }
}

/**
 * Create a new resource tracker
 */
export const createTracker = () => new TestResourceTracker()
