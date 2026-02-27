import { Arbitrary, Schema } from 'effect'
import type FhirR4ChoiceElements from './fhirR4ChoiceElements'
import { capitalize } from 'effect/String'

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

const UnknownFromAny = Schema.declare<any>(
  (input: unknown): input is any => true
).pipe(
  Schema.annotations({
    description: 'A placeholder schema that accepts any value.',
    arbitrary: () => Arbitrary.makeLazy(Schema.Object),
  })
)

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
  code: Datatype('code', UnknownFromAny),
  Reference: Datatype('Reference', UnknownFromAny),
  Identifier: Datatype('Identifier', UnknownFromAny),
  // Primitive types
  base64Binary: Datatype('base64Binary', UnknownFromAny),
  id: Datatype('id', UnknownFromAny),
  instant: Datatype('instant', UnknownFromAny),
  markdown: Datatype('markdown', UnknownFromAny),
  oid: Datatype('oid', UnknownFromAny),
  positiveInt: Datatype('positiveInt', UnknownFromAny),
  unsignedInt: Datatype('unsignedInt', UnknownFromAny),
  uuid: Datatype('uuid', UnknownFromAny),
  // Complex data types
  Address: Datatype('Address', UnknownFromAny),
  Age: Datatype('Age', UnknownFromAny),
  Annotation: Datatype('Annotation', UnknownFromAny),
  Attachment: Datatype('Attachment', UnknownFromAny),
  CodeableConcept: Datatype('CodeableConcept', UnknownFromAny),
  Coding: Datatype('Coding', UnknownFromAny),
  ContactPoint: Datatype('ContactPoint', UnknownFromAny),
  Count: Datatype('Count', UnknownFromAny),
  Distance: Datatype('Distance', UnknownFromAny),
  Duration: Datatype('Duration', UnknownFromAny),
  HumanName: Datatype('HumanName', UnknownFromAny),
  Money: Datatype('Money', UnknownFromAny),
  Period: Datatype('Period', UnknownFromAny),
  Quantity: Datatype('Quantity', UnknownFromAny),
  Range: Datatype('Range', UnknownFromAny),
  Ratio: Datatype('Ratio', UnknownFromAny),
  SampledData: Datatype('SampledData', UnknownFromAny),
  Signature: Datatype('Signature', UnknownFromAny),
  SimpleQuantity: Datatype('SimpleQuantity', UnknownFromAny),
  Timing: Datatype('Timing', UnknownFromAny),
  // Metadata types
  MetaDataTypes: Datatype('MetaDataTypes', UnknownFromAny),
  ContactDetail: Datatype('ContactDetail', UnknownFromAny),
  Contributor: Datatype('Contributor', UnknownFromAny),
  DataRequirement: Datatype('DataRequirement', UnknownFromAny),
  Expression: Datatype('Expression', UnknownFromAny),
  ParameterDefinition: Datatype('ParameterDefinition', UnknownFromAny),
  RelatedArtifact: Datatype('RelatedArtifact', UnknownFromAny),
  TriggerDefinition: Datatype('TriggerDefinition', UnknownFromAny),
  UsageContext: Datatype('UsageContext', UnknownFromAny),
  // Special types
  Dosage: Datatype('Dosage', UnknownFromAny),
  Meta: Datatype('Meta', UnknownFromAny),
  // Wildcard
  '*': Datatype('*', UnknownFromAny),
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

type DatatypeMixinClass<
  Prefix extends string,
  PrefixedFields extends Schema.Struct.Fields,
> = {
  readonly fields: Schema.Simplify<PrefixedFields>
  readonly Encoded: Schema.Struct.Encoded<PrefixedFields>
  new (
    props: Schema.Struct.Constructor<PrefixedFields>,
    options?: Schema.MakeOptions
  ): Schema.Struct.Type<PrefixedFields> & {
    readonly Encoded: Schema.Struct.Encoded<PrefixedFields>
  } & {
    readonly [P in Prefix as `isExactlyOne${Capitalize<P>}Present`]: (
      this: Schema.Struct.Type<PrefixedFields>
    ) => boolean
  } & {
    readonly [P in Prefix as `isNo${Capitalize<P>}Present`]: (
      this: Schema.Struct.Type<PrefixedFields>
    ) => boolean
  }
} & {
  readonly [P in Prefix as `all${Capitalize<P>}Keys`]: () => ReadonlyArray<
    keyof PrefixedFields
  >
}

export function DatatypeChoice<
  const Prefix extends string,
  const PickedKeys extends ReadonlyArray<DatatypeFieldKey>,
>(
  prefix: Prefix,
  pickedKeys: PickedKeys
): DatatypeMixinClass<
  Prefix,
  {
    [K in PickedKeys[number] as `${Prefix}${Capitalize<K>}`]: (typeof datatypeFields)[K]
  }
> {
  type PrefixedFields = {
    [K in PickedKeys[number] as `${Prefix}${Capitalize<K>}`]: (typeof datatypeFields)[K]
  }
  type FieldType = Schema.Struct.Type<PrefixedFields>

  const optionKeys = pickedKeys.map(
    (key: PickedKeys[number]): `${Prefix}${Capitalize<PickedKeys[number]>}` =>
      `${prefix}${capitalize(key)}`
  ) as unknown as ReadonlyArray<keyof FieldType>

  const fields = {} as PrefixedFields
  for (const key in datatypeFields) {
    if (pickedKeys.includes(key as DatatypeFieldKey)) {
      const prefixedKey = `${prefix}${capitalize(key)}` as keyof PrefixedFields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fields[prefixedKey] = (datatypeFields as any)[key]
    }
  }
  class DatatypeMixin {
    static fields = fields as Schema.Simplify<PrefixedFields>
    constructor(_props: FieldType, _options?: Schema.MakeOptions) {}
  }

  Object.assign(DatatypeMixin, {
    [`all${capitalize(prefix)}Keys`]: (): ReadonlyArray<keyof FieldType> =>
      optionKeys,
  })

  Object.assign(DatatypeMixin.prototype, {
    [`isExactlyOne${capitalize(prefix)}Present`](
      this: Schema.Struct.Type<PrefixedFields>
    ): boolean {
      return (
        optionKeys.map((key) => this[key] !== undefined).filter(Boolean)
          .length === 1
      )
    },
    [`isNo${capitalize(prefix)}Present`](
      this: Schema.Struct.Type<PrefixedFields>
    ): boolean {
      return optionKeys.every((key) => this[key] === undefined)
    },
  })

  return DatatypeMixin as any
}

export const DatatypeChoiceEncodedPassthroughFields = <
  const Prefix extends string,
  const PickedKeys extends ReadonlyArray<DatatypeFieldKey>,
>(
  prefix: Prefix,
  pickedKeys: PickedKeys
): {
  [K in PickedKeys[number] as `${Prefix}${Capitalize<K>}`]: Schema.optional<
    Schema.Schema<
      (typeof baseDatatypes)[K]['schema']['Encoded'],
      (typeof baseDatatypes)[K]['schema']['Encoded'],
      never
    >
  >
} =>
  Object.fromEntries(
    pickedKeys.map((key) => [
      `${prefix}${capitalize(key)}`,

      Schema.optional(
        Schema.declare<any>((input: unknown): input is any => true)
      ),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any
