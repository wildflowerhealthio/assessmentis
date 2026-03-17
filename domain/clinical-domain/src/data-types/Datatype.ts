import type { ParseResult, SchemaAST } from 'effect'
import { Arbitrary, Effect, Schema } from 'effect'

import FhirR4ChoiceElements from './fhirR4ChoiceElements'

export { default as FhirR4ChoiceElements } from './fhirR4ChoiceElements'

/**
 * A named FHIR data type paired with its Effect Schema. Used to build
 * choice-element (value\[x\]) unions via {@link DatatypeChoice}.
 *
 * @typeParam Name - The FHIR data type name (e.g. `'string'`, `'CodeableConcept'`)
 * @typeParam A - Decoded type
 * @typeParam I - Encoded type
 */
export interface Datatype<out Name extends string, A, I> {
  readonly name: Name
  readonly schema: Schema.Schema<A, I, never>
  from: <Others extends { _tag: string }>(
    value: Others | undefined | ({ _tag: Name } & { [K in Name]: A })
  ) => A | undefined
}

/**
 * Factory function to create a Datatype.
 *
 * Builds a `Schema.Struct({ value${Name}: schema })` for use in ValueUnion.
 */
export const Datatype = <const Name extends string, A, I>(
  name: Name,
  schema: Schema.Schema<A, I, never>
): Datatype<Name, A, I> =>
  ({
    name,
    schema,
    from: <Others extends { _tag: string }>(
      value: Others | undefined | ({ _tag: Name } & { [K in Name]: A })
    ) =>
      value &&
      value._tag === name &&
      (value as { [K in Name]?: A })[name] !== undefined
        ? (value as { [K in Name]: A })[name]
        : undefined,
  }) as const

// ---------------------------------------------------------------------------
// Primitive datatypes (no external imports beyond Code)
// ---------------------------------------------------------------------------

export const StringDatatype = Datatype('string', Schema.String)
export const BooleanDatatype = Datatype('boolean', Schema.Boolean)
export const DecimalDatatype = Datatype('decimal', Schema.Number)
export const IntegerDatatype = Datatype('integer', Schema.Number)
export const DateDatatype = Datatype('date', Schema.DateFromString)
export const DateTimeDatatype = Datatype('dateTime', Schema.DateTimeUtc)
export const TimeDatatype = Datatype('time', Schema.String)
export const UriDatatype = Datatype('uri', Schema.String)
export const UrlDatatype = Datatype('url', Schema.String)
export const CanonicalDatatype = Datatype('canonical', Schema.String)

// The `any` here is intentional for maximum compatibility on the input side —
// `Schema.declare` parameterizes the *decoded* type, and using `unknown` would
// be overly restrictive for a pass-through placeholder. With `any`, the schema
// accepts any encoded value and maps to `unknown` on the decoded side, so the
// `any` never leaks into consumer code and carries no type-safety risk.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PermissivePassthrough = Schema.declare<unknown, any, []>(
  [],
  {
    encode:
      () =>
      (
        x: unknown,
        _options: SchemaAST.ParseOptions,
        _declaration: SchemaAST.Declaration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ): Effect.Effect<any, ParseResult.ParseIssue, never> =>
        Effect.succeed(x),
    decode:
      () =>
      (
        x: unknown,
        _options: SchemaAST.ParseOptions,
        _declaration: SchemaAST.Declaration
      ): Effect.Effect<unknown, ParseResult.ParseIssue, never> =>
        Effect.succeed(x),
  },
  {
    description: 'A placeholder schema that accepts any value.',
    arbitrary: () => Arbitrary.makeLazy(Schema.Object),
  }
)

/**
 * Lookup table of all FHIR R4 data type names to their {@link Datatype}
 * definitions. Primitive types use typed schemas; complex types that are not
 * yet fully modeled use a permissive `PermissivePassthrough` placeholder.
 */
export const baseDatatypes = {
  string: StringDatatype,
  boolean: BooleanDatatype,
  decimal: DecimalDatatype,
  integer: IntegerDatatype,
  date: DateDatatype,
  dateTime: DateTimeDatatype,
  time: TimeDatatype,
  uri: UriDatatype,
  url: UrlDatatype,
  canonical: CanonicalDatatype,
  code: Datatype('code', PermissivePassthrough),
  Reference: Datatype('Reference', PermissivePassthrough),
  Identifier: Datatype('Identifier', PermissivePassthrough),
  // Primitive types
  base64Binary: Datatype('base64Binary', PermissivePassthrough),
  id: Datatype('id', PermissivePassthrough),
  instant: Datatype('instant', PermissivePassthrough),
  markdown: Datatype('markdown', PermissivePassthrough),
  oid: Datatype('oid', PermissivePassthrough),
  positiveInt: Datatype('positiveInt', PermissivePassthrough),
  unsignedInt: Datatype('unsignedInt', PermissivePassthrough),
  uuid: Datatype('uuid', PermissivePassthrough),
  // Complex data types
  Address: Datatype('Address', PermissivePassthrough),
  Age: Datatype('Age', PermissivePassthrough),
  Annotation: Datatype('Annotation', PermissivePassthrough),
  Attachment: Datatype('Attachment', PermissivePassthrough),
  CodeableConcept: Datatype('CodeableConcept', PermissivePassthrough),
  Coding: Datatype('Coding', PermissivePassthrough),
  ContactPoint: Datatype('ContactPoint', PermissivePassthrough),
  Count: Datatype('Count', PermissivePassthrough),
  Distance: Datatype('Distance', PermissivePassthrough),
  Duration: Datatype('Duration', PermissivePassthrough),
  HumanName: Datatype('HumanName', PermissivePassthrough),
  Money: Datatype('Money', PermissivePassthrough),
  Period: Datatype('Period', PermissivePassthrough),
  Quantity: Datatype('Quantity', PermissivePassthrough),
  Range: Datatype('Range', PermissivePassthrough),
  Ratio: Datatype('Ratio', PermissivePassthrough),
  SampledData: Datatype('SampledData', PermissivePassthrough),
  Signature: Datatype('Signature', PermissivePassthrough),
  SimpleQuantity: Datatype('SimpleQuantity', PermissivePassthrough),
  Timing: Datatype('Timing', PermissivePassthrough),
  // Metadata types
  MetaDataTypes: Datatype('MetaDataTypes', PermissivePassthrough),
  ContactDetail: Datatype('ContactDetail', PermissivePassthrough),
  Contributor: Datatype('Contributor', PermissivePassthrough),
  DataRequirement: Datatype('DataRequirement', PermissivePassthrough),
  Expression: Datatype('Expression', PermissivePassthrough),
  ParameterDefinition: Datatype('ParameterDefinition', PermissivePassthrough),
  RelatedArtifact: Datatype('RelatedArtifact', PermissivePassthrough),
  TriggerDefinition: Datatype('TriggerDefinition', PermissivePassthrough),
  UsageContext: Datatype('UsageContext', PermissivePassthrough),
  // Special types
  Dosage: Datatype('Dosage', PermissivePassthrough),
  Meta: Datatype('Meta', PermissivePassthrough),
} as const

/** All data type names available for choice-element fields. */
export const AllDatatypeNames = FhirR4ChoiceElements['*']

/** String-literal union of all data type names in {@link baseDatatypes}. */
export type DatatypeName = keyof typeof baseDatatypes

/**
 * Builds a `Schema.Union` of `Schema.TaggedStruct` variants representing a
 * choice element (value\[x\]). Each data type name becomes a tagged variant
 * with `_tag` set to the type name and the value under the same key.
 *
 * @example
 * ```typescript
 * const ValueChoice = DatatypeChoice(['Quantity', 'string', 'boolean'])
 * // Produces: { _tag: 'Quantity', Quantity: ... } | { _tag: 'string', string: ... } | ...
 *
 * // Use as a field on a resource:
 * const fields = { value: Schema.optional(ValueChoice) }
 * ```
 *
 * @param datatypeNames - Array of data type names to include in the choice
 * @param overrideFields - Optional array of {@link Datatype} overrides for specific names
 */
export function DatatypeChoice<
  const DatatypeNames extends ReadonlyArray<DatatypeName>,
  const Overrides extends ReadonlyArray<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Datatype<DatatypeNames[number], any, any>
  > = [],
>(datatypeNames: DatatypeNames, overrideFields?: Overrides) {
  const variants: {
    [K in keyof DatatypeNames]: DatatypeNames[K] extends DatatypeName
      ? Schema.TaggedStruct<
          DatatypeNames[K],
          {
            [F in DatatypeNames[K]]: DatatypeNames[K] extends Overrides[number]['name']
              ? Extract<Overrides[number], { name: DatatypeNames[K] }>['schema']
              : (typeof baseDatatypes)[DatatypeNames[K]]['schema']
          }
        >
      : never
  } = datatypeNames.map((name) => {
    const schema =
      overrideFields?.find((o) => o.name === name)?.schema ??
      baseDatatypes[name].schema
    return Schema.TaggedStruct(name, { [name]: schema })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any

  const u = Schema.Union(...variants)
  const s = u as typeof u & {
    make: (
      encoded: typeof u.Encoded,
      overrideOptions?: SchemaAST.ParseOptions
    ) => typeof u.Type
  }
  s.make = Schema.decodeSync(
    u as Schema.Schema<typeof u.Type, typeof u.Encoded, never>
  )
  return s
}

// ---------------------------------------------------------------------------
// DatatypeChoice utilities — `cases` and `match`
// ---------------------------------------------------------------------------

export namespace DatatypeChoice {
  /** Extract all `_tag` string literals from a DatatypeChoice union. */
  export type TagsOf<T> = T extends {
    readonly _tag: infer Tag extends string
  }
    ? Tag
    : never

  /** Extract the variant matching a specific tag from a DatatypeChoice union. */
  export type VariantFor<T, Tag extends string> = Extract<
    T,
    { readonly _tag: Tag }
  >

  /** Extract the inner value type for a specific tag from a DatatypeChoice union. */
  export type ValueFor<T, Tag extends string> =
    VariantFor<T, Tag> extends infer V
      ? Tag extends keyof V
        ? V[Tag]
        : never
      : never

  /** Object with all possible tag keys mapped to `value | undefined`. */
  export type Cases<T> = {
    readonly [Tag in TagsOf<T>]: ValueFor<T, Tag> | undefined
  }

  /**
   * Decompose a DatatypeChoice value into an object keyed by every possible
   * tag, where the active variant's key holds its inner value and all others
   * are `undefined`.
   *
   * @example
   * ```typescript
   * const { Quantity, string: s } = DatatypeChoice.cases(observation.value)
   * if (Quantity) { /* typed as unknown (PermissivePassthrough) *\/ }
   * if (s) { /* typed as string *\/ }
   * ```
   */
  export function cases<T extends { readonly _tag: string }>(
    value: T | undefined
  ): Cases<T> {
    return (value ?? {}) as Cases<T>
  }

  /**
   * Pattern-match on a DatatypeChoice value. Without a default handler,
   * the matchers object must be exhaustive (cover every tag). With a default,
   * unmatched tags fall through to it.
   *
   * Each callback receives the **inner value** for that tag (not the full
   * `{ _tag, ... }` variant).
   *
   * @example
   * ```typescript
   * // Exhaustive — compiler enforces all tags are covered
   * const label = DatatypeChoice.match(v, {
   *   string: (s) => s,
   *   boolean: (b) => b ? 'Yes' : 'No',
   *   Quantity: (q) => `${(q as { value?: number })?.value ?? ''}`,
   * })
   *
   * // Partial — unmatched tags hit the default
   * const label = DatatypeChoice.match(v, {
   *   string: (s) => s,
   *   boolean: (b) => b ? 'Yes' : 'No',
   * }, (_unmatched) => '')
   * ```
   */
  export function match<TDatatypeName extends DatatypeName, R>(
    value: {
      [K in TDatatypeName]: { _tag: K } & {
        [F in K]: Schema.Schema.Type<(typeof baseDatatypes)[F]['schema']>
      }
    }[TDatatypeName],
    matchers: {
      readonly [Name in TDatatypeName]: (
        value: Schema.Schema.Type<(typeof baseDatatypes)[Name]['schema']>
      ) => R
    }
  ): R
  export function match<TDatatypeName extends DatatypeName, R>(
    value: {
      [K in TDatatypeName]: { _tag: K } & {
        [F in K]: Schema.Schema.Type<(typeof baseDatatypes)[F]['schema']>
      }
    }[TDatatypeName],
    matchers: {
      readonly [Name in TDatatypeName]?: (
        value: Schema.Schema.Type<(typeof baseDatatypes)[Name]['schema']>
      ) => R | undefined
    },
    defaultFn: (
      unmatched: {
        [K in TDatatypeName]: { _tag: K } & {
          [F in K]: Schema.Schema.Type<(typeof baseDatatypes)[F]['schema']>
        }
      }[TDatatypeName]
    ) => R
  ): R
  export function match<TDatatypeName extends DatatypeName, R>(
    value: {
      [K in TDatatypeName]: { _tag: K } & {
        [F in K]: Schema.Schema.Type<(typeof baseDatatypes)[F]['schema']>
      }
    }[TDatatypeName],
    matchers: {
      readonly [Name in TDatatypeName]?: (
        value: Schema.Schema.Type<(typeof baseDatatypes)[Name]['schema']>
      ) => R | undefined
    },
    defaultFn?: (
      unmatched: {
        [K in TDatatypeName]: { _tag: K } & {
          [F in K]: Schema.Schema.Type<(typeof baseDatatypes)[F]['schema']>
        }
      }[TDatatypeName]
    ) => R
  ): R {
    const tag = value._tag
    const matcher = matchers[value._tag]
    if (matcher) {
      // Typescript can't infer the unknown (but shared!) type of the matcher
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (matcher as any)(value[value._tag])
    }
    if (defaultFn) {
      return defaultFn(value)
    }
    throw new Error(
      `DatatypeChoice.match: no handler for tag "${tag}" and no default provided`
    )
  }
}
