import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import type { DailyCoFixture } from '../handlers/dailyco-handler-factory'

export interface RecordedRequest {
  method: string
  endpoint: string
  params?: Record<string, string>
  body?: unknown
}

export interface RecordedResponse {
  status: number
  body: unknown
}

/**
 * FixtureRecorder records API responses during live tests
 * and saves them as JSON fixtures for replay tests.
 *
 * Enable recording by setting RECORD_FIXTURES=true
 */
export class FixtureRecorder {
  private recordings: Map<string, DailyCoFixture> = new Map()
  private readonly outputDir: string
  private readonly isRecording: boolean

  constructor(outputDir: string) {
    this.outputDir = outputDir
    this.isRecording = process.env.RECORD_FIXTURES === 'true'
  }

  get shouldRecord(): boolean {
    return this.isRecording
  }

  /**
   * Record a fixture from a live API response
   */
  record(
    fixtureKey: string,
    request: RecordedRequest,
    response: RecordedResponse,
    description?: string
  ): void {
    if (!this.isRecording) return

    const fixture: DailyCoFixture = {
      request,
      response,
      metadata: {
        recordedAt: new Date().toISOString(),
        description,
      },
    }

    this.recordings.set(fixtureKey, fixture)
  }

  /**
   * Flush all recorded fixtures to disk
   */
  async flush(resourceType: string): Promise<void> {
    if (!this.isRecording || this.recordings.size === 0) return

    const dir = path.join(this.outputDir, resourceType.toLowerCase())
    await fs.mkdir(dir, { recursive: true })

    for (const [fixtureKey, fixture] of this.recordings) {
      const filename = `${fixtureKey}.json`
      const content = JSON.stringify(fixture, null, 2)
      await fs.writeFile(path.join(dir, filename), content, 'utf-8')
    }

    this.recordings.clear()
  }

  /**
   * Clear all recordings without flushing
   */
  clear(): void {
    this.recordings.clear()
  }
}

// Default fixture output directory
const FIXTURES_DIR = path.join(
  import.meta.dirname,
  '..',
  '..',
  'test',
  'fixtures'
)

/**
 * Create a recorder instance
 */
export const createRecorder = (outputDir: string = FIXTURES_DIR) =>
  new FixtureRecorder(outputDir)
