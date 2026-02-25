import { Schema } from 'effect'
import type FhirR4ChoiceElements from './fhirR4ChoiceElements'
import { capitalize } from 'effect/String'
import { never } from 'effect/Fiber'

interface Datatype<Name extends string, A, I> {
  name: Name
  schema: Schema.Schema<A, I, never>
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

type FhirR4DatatypeOptionNames =
  FhirR4ChoiceElements[keyof FhirR4ChoiceElements][number]

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
  code: Datatype('code', Schema.Unknown),
  Reference: Datatype('Reference', Schema.Unknown),
  Identifier: Datatype('Identifier', Schema.Unknown),
  // Primitive types
  base64Binary: Datatype('base64Binary', Schema.Unknown),
  id: Datatype('id', Schema.Unknown),
  instant: Datatype('instant', Schema.Unknown),
  markdown: Datatype('markdown', Schema.Unknown),
  oid: Datatype('oid', Schema.Unknown),
  positiveInt: Datatype('positiveInt', Schema.Unknown),
  unsignedInt: Datatype('unsignedInt', Schema.Unknown),
  uuid: Datatype('uuid', Schema.Unknown),
  // Complex data types
  Address: Datatype('Address', Schema.Unknown),
  Age: Datatype('Age', Schema.Unknown),
  Annotation: Datatype('Annotation', Schema.Unknown),
  Attachment: Datatype('Attachment', Schema.Unknown),
  CodeableConcept: Datatype('CodeableConcept', Schema.Unknown),
  Coding: Datatype('Coding', Schema.Unknown),
  ContactPoint: Datatype('ContactPoint', Schema.Unknown),
  Count: Datatype('Count', Schema.Unknown),
  Distance: Datatype('Distance', Schema.Unknown),
  Duration: Datatype('Duration', Schema.Unknown),
  HumanName: Datatype('HumanName', Schema.Unknown),
  Money: Datatype('Money', Schema.Unknown),
  Period: Datatype('Period', Schema.Unknown),
  Quantity: Datatype('Quantity', Schema.Unknown),
  Range: Datatype('Range', Schema.Unknown),
  Ratio: Datatype('Ratio', Schema.Unknown),
  SampledData: Datatype('SampledData', Schema.Unknown),
  Signature: Datatype('Signature', Schema.Unknown),
  SimpleQuantity: Datatype('SimpleQuantity', Schema.Unknown),
  Timing: Datatype('Timing', Schema.Unknown),
  // Metadata types
  MetaDataTypes: Datatype('MetaDataTypes', Schema.Unknown),
  ContactDetail: Datatype('ContactDetail', Schema.Unknown),
  Contributor: Datatype('Contributor', Schema.Unknown),
  DataRequirement: Datatype('DataRequirement', Schema.Unknown),
  Expression: Datatype('Expression', Schema.Unknown),
  ParameterDefinition: Datatype('ParameterDefinition', Schema.Unknown),
  RelatedArtifact: Datatype('RelatedArtifact', Schema.Unknown),
  TriggerDefinition: Datatype('TriggerDefinition', Schema.Unknown),
  UsageContext: Datatype('UsageContext', Schema.Unknown),
  // Special types
  Dosage: Datatype('Dosage', Schema.Unknown),
  Meta: Datatype('Meta', Schema.Unknown),
  // Wildcard
  '*': Datatype('*', Schema.Unknown),
} as const satisfies {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly [K in FhirR4DatatypeOptionNames]: Datatype<K, any, any>
}
type BaseDatatypes = typeof baseDatatypes

const datatypeFields = {
  string: Schema.optional(StringDatatype.schema),
  boolean: Schema.optional(BooleanDatatype.schema),
  decimal: Schema.optional(DecimalDatatype.schema),
  integer: Schema.optional(IntegerDatatype.schema),
  date: Schema.optional(DateDatatype.schema),
  dateTime: Schema.optional(DateTimeDatatype.schema),
  time: Schema.optional(TimeDatatype.schema),
  uri: Schema.optional(UriDatatype.schema),
  url: Schema.optional(UrlDatatype.schema),
  canonical: Schema.optional(CanonicalDatatype.schema),
  code: Schema.optional(baseDatatypes.code.schema),
  Reference: Schema.optional(baseDatatypes.Reference.schema),
  Identifier: Schema.optional(baseDatatypes.Identifier.schema),
  // Primitive types
  base64Binary: Schema.optional(baseDatatypes.base64Binary.schema),
  id: Schema.optional(baseDatatypes.id.schema),
  instant: Schema.optional(baseDatatypes.instant.schema),
  markdown: Schema.optional(baseDatatypes.markdown.schema),
  oid: Schema.optional(baseDatatypes.oid.schema),
  positiveInt: Schema.optional(baseDatatypes.positiveInt.schema),
  unsignedInt: Schema.optional(baseDatatypes.unsignedInt.schema),
  uuid: Schema.optional(baseDatatypes.uuid.schema),
  // Complex data types
  Address: Schema.optional(baseDatatypes.Address.schema),
  Age: Schema.optional(baseDatatypes.Age.schema),
  Annotation: Schema.optional(baseDatatypes.Annotation.schema),
  Attachment: Schema.optional(baseDatatypes.Attachment.schema),
  CodeableConcept: Schema.optional(baseDatatypes.CodeableConcept.schema),
  Coding: Schema.optional(baseDatatypes.Coding.schema),
  ContactPoint: Schema.optional(baseDatatypes.ContactPoint.schema),
  Count: Schema.optional(baseDatatypes.Count.schema),
  Distance: Schema.optional(baseDatatypes.Distance.schema),
  Duration: Schema.optional(baseDatatypes.Duration.schema),
  HumanName: Schema.optional(baseDatatypes.HumanName.schema),
  Money: Schema.optional(baseDatatypes.Money.schema),
  Period: Schema.optional(baseDatatypes.Period.schema),
  Quantity: Schema.optional(baseDatatypes.Quantity.schema),
  Range: Schema.optional(baseDatatypes.Range.schema),
  Ratio: Schema.optional(baseDatatypes.Ratio.schema),
  SampledData: Schema.optional(baseDatatypes.SampledData.schema),
  Signature: Schema.optional(baseDatatypes.Signature.schema),
  SimpleQuantity: Schema.optional(baseDatatypes.SimpleQuantity.schema),
  Timing: Schema.optional(baseDatatypes.Timing.schema),
  // Metadata types
  MetaDataTypes: Schema.optional(baseDatatypes.MetaDataTypes.schema),
  ContactDetail: Schema.optional(baseDatatypes.ContactDetail.schema),
  Contributor: Schema.optional(baseDatatypes.Contributor.schema),
  DataRequirement: Schema.optional(baseDatatypes.DataRequirement.schema),
  Expression: Schema.optional(baseDatatypes.Expression.schema),
  ParameterDefinition: Schema.optional(
    baseDatatypes.ParameterDefinition.schema
  ),
  RelatedArtifact: Schema.optional(baseDatatypes.RelatedArtifact.schema),
  TriggerDefinition: Schema.optional(baseDatatypes.TriggerDefinition.schema),
  UsageContext: Schema.optional(baseDatatypes.UsageContext.schema),
  // Special types
  Dosage: Schema.optional(baseDatatypes.Dosage.schema),
  Meta: Schema.optional(baseDatatypes.Meta.schema),
  // Wildcard
  '*': Schema.optional(baseDatatypes['*'].schema),
} as const satisfies {
  [K in FhirR4ChoiceElements[keyof FhirR4ChoiceElements][number] as BaseDatatypes[K]['name']]: Schema.optional<
    BaseDatatypes[K]['schema']
  >
}

export const AllDatatypeKeys = Object.keys(datatypeFields) as ReadonlyArray<
  keyof typeof datatypeFields
>

type DatatypeFieldKey = keyof typeof datatypeFields

export function DatatypeChoice<
  const Prefix extends string,
  const PickedKeys extends ReadonlyArray<DatatypeFieldKey>,
>(prefix: Prefix, pickedKeys: PickedKeys) {
  type PrefixedKey =
    `${Prefix}${Capitalize<DatatypeFieldKey & PickedKeys[number]>}`

  // -- fields ---------------------------------------------------------------

  type PrefixedFields = {
    [K in DatatypeFieldKey as K extends PickedKeys[number]
      ? `${Prefix}${Capitalize<K>}`
      : never]: (typeof datatypeFields)[K]
  }

  const fields = {} as PrefixedFields
  for (const key in datatypeFields) {
    if (pickedKeys.includes(key as DatatypeFieldKey)) {
      const prefixedKey = `${prefix}${capitalize(key)}` as keyof PrefixedFields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fields[prefixedKey] = (datatypeFields as any)[key]
    }
  }

  // -- Mixin ----------------------------------------------------------------

  type Base = {
    [K in DatatypeFieldKey &
      PickedKeys[number] as `${Prefix}${Capitalize<K>}`]?: unknown
  }

  const optionKeys = (
    Object.keys(datatypeFields) as ReadonlyArray<DatatypeFieldKey>
  )
    .filter((key) => pickedKeys.includes(key))
    .map((key) => `${prefix}${capitalize(key)}`) as ReadonlyArray<PrefixedKey>

  return class DatatypeMixin {
    static fields = fields as Schema.Simplify<PrefixedFields>
    static Type = {} as Schema.Struct.Type<typeof fields>
    static Encoded = {} as Schema.Struct.Encoded<typeof fields>
    static Context = never
    static make = (): DatatypeMixin => new DatatypeMixin()

    static allOptionKeys = (): ReadonlyArray<PrefixedKey> => optionKeys

    isExactlyOnePresent(this: Base): boolean {
      return (
        optionKeys.map((key) => this[key] !== undefined).filter(Boolean)
          .length === 1
      )
    }

    isNonePresent(this: Base): boolean {
      return optionKeys.every((key) => this[key] === undefined)
    }
  }
}
