import { ReadonlyUrl } from '@assessmentis/effectful-store'

/**
 * Recursively walks a schema-generated value and rewrites every defined `url`
 * field on Element-like objects (those with a `domainType` string property) so
 * they share a common FHIR-style prefix: `{baseUrl}/{domainType}/{id}`.
 *
 * - URLs that were `undefined` stay `undefined`.
 * - Non-Element objects, arrays, and primitives are traversed structurally but
 *   otherwise left untouched.
 * - Class prototypes are preserved so `instanceof` checks and Schema.encode
 *   continue to work on the returned value.
 *
 * Intended for test arbitraries where `Arbitrary.make(schema)` produces
 * uncoordinated URLs across nested Elements.
 *
 * NOTE: contains one unavoidable `as T` cast at the return boundary — the
 * recursive walk preserves the structural type (only ReadonlyUrl values
 * change) but TypeScript cannot verify this.
 */
export const deepAssignBaseUrls = <T>(value: T, baseUrl: ReadonlyUrl): T => {
  let counter = 0

  const walk = (v: unknown): unknown => {
    if (v === null || v === undefined) {
      return v
    }
    if (typeof v !== 'object') {
      return v
    }
    if (v instanceof Date) {
      return v
    }
    if (v instanceof URL) {
      return v
    }
    if (v instanceof ReadonlyUrl) {
      return v
    }

    if (Array.isArray(v)) {
      const mapped = v.map((item) => walk(item))
      if (mapped.some((el, i) => el !== v[i])) {
        return mapped
      }
      return v
    }

    const isElement = 'domainType' in v && typeof v.domainType === 'string'

    const rebuilt: Record<string, unknown> = {}
    let changed = false
    let domainType: string | undefined
    if ('domainType' in v && typeof v.domainType === 'string') {
      domainType = v.domainType
    } else {
      domainType = undefined
    }

    if (domainType) {
      for (const [key, val] of Object.entries(v)) {
        if (key === 'url' && isElement && val instanceof ReadonlyUrl) {
          rebuilt[key] = baseUrl.appendToPathname(`/${domainType}/${String(++counter)}`)
          changed = true
        } else {
          const walked = walk(val)
          rebuilt[key] = walked
          if (walked !== val) {
            changed = true
          }
        }
      }
    }
    // If nothing changed, return the original object as-is — avoids
    // Expensive Schema.Class reconstruction for unchanged subtrees.
    if (!changed) {
      return v
    }

    // Use the class's make() to properly construct instances (Schema.Class
    // Relies on constructor-level setup that Object.create skips).
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const ctor = (Object.getPrototypeOf(v) as object).constructor as {
      make?: (input: Record<string, unknown>) => unknown
    }
    if (typeof ctor.make === 'function') {
      return ctor.make(rebuilt)
    }
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return Object.assign(Object.create(Object.getPrototypeOf(v) as object), rebuilt)
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return walk(value) as T
}
