import * as fs from 'node:fs'
import * as path from 'node:path'
import type { FhirFixture } from '../handlers/fhir-handler-factory'

const FIXTURES_DIR = path.join(
  import.meta.dirname,
  '..',
  '..',
  'test',
  'fixtures'
)

/**
 * Load a fixture from a JSON file
 */
export const loadFixture = <T = unknown>(
  resourceType: string,
  fixtureName: string
): FhirFixture<T> => {
  const filePath = path.join(
    FIXTURES_DIR,
    resourceType.toLowerCase(),
    `${fixtureName}.json`
  )

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Fixture not found: ${filePath}\n` +
        'Run "npm run test:live:record" to generate fixtures'
    )
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content) as FhirFixture<T>
}

/**
 * Check if a fixture exists
 */
export const fixtureExists = (
  resourceType: string,
  fixtureName: string
): boolean => {
  const filePath = path.join(
    FIXTURES_DIR,
    resourceType.toLowerCase(),
    `${fixtureName}.json`
  )
  return fs.existsSync(filePath)
}

/**
 * List all fixtures for a resource type
 */
export const listFixtures = (resourceType: string): string[] => {
  const dir = path.join(FIXTURES_DIR, resourceType.toLowerCase())

  if (!fs.existsSync(dir)) {
    return []
  }

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''))
}
