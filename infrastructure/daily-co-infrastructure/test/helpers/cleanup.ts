import { Effect } from 'effect'
import { ExternalVideoCallClient } from '@assessmentis/video-call-domain'

export interface TrackedRoom {
  roomName: string
}

/**
 * TestRoomTracker tracks rooms created during tests
 * and provides cleanup functionality.
 *
 * Note: Daily.co rooms auto-expire, so cleanup is optional
 */
export class TestRoomTracker {
  private rooms: TrackedRoom[] = []

  /**
   * Track a room for cleanup
   */
  track(roomName: string): void {
    this.rooms.push({ roomName })
  }

  /**
   * Get count of tracked rooms
   */
  get count(): number {
    return this.rooms.length
  }

  /**
   * Clear tracking without cleanup
   */
  clear(): void {
    this.rooms = []
  }

  /**
   * Note: Daily.co API doesn't have a delete room endpoint
   * Rooms automatically expire based on their exp property
   * This cleanup is a no-op but kept for interface consistency
   */
  cleanup(): Effect.Effect<void, never, ExternalVideoCallClient> {
    return Effect.gen(this, function* () {
      // Daily.co rooms auto-expire, no cleanup needed
      this.rooms = []
    })
  }
}

/**
 * Create a new room tracker
 */
export const createTracker = () => new TestRoomTracker()
