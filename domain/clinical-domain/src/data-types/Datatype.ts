import { Arbitrary, Schema, type FastCheck } from 'effect'
import { capitalize } from 'effect/String'

import type FhirR4ChoiceElements from './fhirR4ChoiceElements'

export interface Datatype<out Name extends string, A, I> {
  readonly name: Name
  readonly schema: Schema.Schema<A, I, never>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const UnknownFromAny = Schema.declare<any>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (_input: unknown): _input is any => true
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

const arbitraries: {
  [K in keyof typeof baseDatatypes]: FastCheck.Arbitrary<
    Schema.Schema.Type<(typeof baseDatatypes)[K]['schema']>
  >
} = {
  string: Arbitrary.make(baseDatatypes.string.schema),
  boolean: Arbitrary.make(baseDatatypes.boolean.schema),
  decimal: Arbitrary.make(baseDatatypes.decimal.schema),
  integer: Arbitrary.make(baseDatatypes.integer.schema),
  date: Arbitrary.make(baseDatatypes.date.schema),
  dateTime: Arbitrary.make(baseDatatypes.dateTime.schema),
  time: Arbitrary.make(baseDatatypes.time.schema),
  uri: Arbitrary.make(baseDatatypes.uri.schema),
  url: Arbitrary.make(baseDatatypes.url.schema),
  canonical: Arbitrary.make(baseDatatypes.canonical.schema),
  code: Arbitrary.make(baseDatatypes.code.schema),
  Reference: Arbitrary.make(baseDatatypes.Reference.schema),
  Identifier: Arbitrary.make(baseDatatypes.Identifier.schema),
  // Primitive types
  base64Binary: Arbitrary.make(baseDatatypes.base64Binary.schema),
  id: Arbitrary.make(baseDatatypes.id.schema),
  instant: Arbitrary.make(baseDatatypes.instant.schema),
  markdown: Arbitrary.make(baseDatatypes.markdown.schema),
  oid: Arbitrary.make(baseDatatypes.oid.schema),
  positiveInt: Arbitrary.make(baseDatatypes.positiveInt.schema),
  unsignedInt: Arbitrary.make(baseDatatypes.unsignedInt.schema),
  uuid: Arbitrary.make(baseDatatypes.uuid.schema),
  // Complex data types
  Address: Arbitrary.make(baseDatatypes.Address.schema),
  Age: Arbitrary.make(baseDatatypes.Age.schema),
  Annotation: Arbitrary.make(baseDatatypes.Annotation.schema),
  Attachment: Arbitrary.make(baseDatatypes.Attachment.schema),
  CodeableConcept: Arbitrary.make(baseDatatypes.CodeableConcept.schema),
  Coding: Arbitrary.make(baseDatatypes.Coding.schema),
  ContactPoint: Arbitrary.make(baseDatatypes.ContactPoint.schema),
  Count: Arbitrary.make(baseDatatypes.Count.schema),
  Distance: Arbitrary.make(baseDatatypes.Distance.schema),
  Duration: Arbitrary.make(baseDatatypes.Duration.schema),
  HumanName: Arbitrary.make(baseDatatypes.HumanName.schema),
  Money: Arbitrary.make(baseDatatypes.Money.schema),
  Period: Arbitrary.make(baseDatatypes.Period.schema),
  Quantity: Arbitrary.make(baseDatatypes.Quantity.schema),
  Range: Arbitrary.make(baseDatatypes.Range.schema),
  Ratio: Arbitrary.make(baseDatatypes.Ratio.schema),
  SampledData: Arbitrary.make(baseDatatypes.SampledData.schema),
  Signature: Arbitrary.make(baseDatatypes.Signature.schema),
  SimpleQuantity: Arbitrary.make(baseDatatypes.SimpleQuantity.schema),
  Timing: Arbitrary.make(baseDatatypes.Timing.schema),
  // Metadata types
  MetaDataTypes: Arbitrary.make(baseDatatypes.MetaDataTypes.schema),
  ContactDetail: Arbitrary.make(baseDatatypes.ContactDetail.schema),
  Contributor: Arbitrary.make(baseDatatypes.Contributor.schema),
  DataRequirement: Arbitrary.make(baseDatatypes.DataRequirement.schema),
  Expression: Arbitrary.make(baseDatatypes.Expression.schema),
  ParameterDefinition: Arbitrary.make(baseDatatypes.ParameterDefinition.schema),
  RelatedArtifact: Arbitrary.make(baseDatatypes.RelatedArtifact.schema),
  TriggerDefinition: Arbitrary.make(baseDatatypes.TriggerDefinition.schema),
  UsageContext: Arbitrary.make(baseDatatypes.UsageContext.schema),
  // Special types
  Dosage: Arbitrary.make(baseDatatypes.Dosage.schema),
  Meta: Arbitrary.make(baseDatatypes.Meta.schema),
  // Wildcard
  '*': Arbitrary.make(baseDatatypes['*'].schema),
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

export type DatatypeFieldKey = keyof typeof datatypeFields

type DatatypeMixinClass<
  Self,
  Prefix extends string,
  PrefixedFields extends Schema.Struct.Fields,
> = Schema.Class<
  Self,
  PrefixedFields,
  Schema.Struct.Encoded<PrefixedFields>,
  Schema.Struct.Context<PrefixedFields>,
  Schema.Struct.Constructor<PrefixedFields>,
  {
    readonly [P in Prefix as `isExactlyOne${Capitalize<P>}Present`]: (
      this: Schema.Struct.Type<PrefixedFields>
    ) => boolean
  } & {
    readonly [P in Prefix as `isNo${Capitalize<P>}Present`]: (
      this: Schema.Struct.Type<PrefixedFields>
    ) => boolean
  },
  object
> & {
  readonly [P in Prefix as `all${Capitalize<P>}Keys`]: () => ReadonlyArray<
    keyof PrefixedFields
  >
} & {
  readonly [P in Prefix as `arbitrary${Capitalize<P>}OneOrNone`]: Arbitrary.LazyArbitrary<
    Schema.Struct.Type<PrefixedFields>
  >
}

export function DatatypeChoice<
  Self,
  const Prefix extends string,
  const PickedKeys extends ReadonlyArray<DatatypeFieldKey>,
  const OverrideFields extends ReadonlyArray<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Datatype<PickedKeys[number], any, any>
  > = [],
>(
  identifier: string,
  prefix: Prefix,
  pickedKeys: PickedKeys,
  overrideFields?: OverrideFields
): DatatypeMixinClass<
  Self,
  Prefix,
  {
    [K in Exclude<
      PickedKeys[number],
      OverrideFields[number]['name']
    > as `${Prefix}${Capitalize<K>}`]: (typeof datatypeFields)[K]
  } & {
    [K in OverrideFields[number]['name'] as `${Prefix}${Capitalize<K>}`]: Schema.optional<
      Extract<OverrideFields[number], { name: K }>['schema']
    >
  }
> {
  type PrefixedFields = {
    [K in Exclude<
      PickedKeys[number],
      OverrideFields[number]['name']
    > as `${Prefix}${Capitalize<K>}`]: (typeof datatypeFields)[K]
  } & {
    [K in OverrideFields[number]['name'] as `${Prefix}${Capitalize<K>}`]: Schema.optional<
      Extract<OverrideFields[number], { name: K }>['schema']
    >
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
  for (const override of overrideFields ?? []) {
    const prefixedKey =
      `${prefix}${capitalize(override.name)}` satisfies `${Prefix}${Capitalize<OverrideFields[number]['name']>}` as keyof PrefixedFields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fields[prefixedKey] = Schema.optional(override.schema) as any
  }

  const DatatypeMixin = Schema.Class<Self>(identifier)(fields, {
    arbitrary: (_fcx) => (fc) =>
      fc.constantFrom(...pickedKeys).chain((key) =>
        arbitraries[key].map(
          (u) =>
            ({
              [`${prefix}${capitalize(key)}` as keyof FieldType]: u,
            }) as Self
        )
      ),
  })
  if (typeof DatatypeMixin === 'string') throw new Error(DatatypeMixin)

  const arbitraryOneOrNone: Arbitrary.LazyArbitrary<
    Schema.Struct.Type<PrefixedFields>
  > = (fc: typeof FastCheck) =>
    fc.constantFrom(...pickedKeys).chain((key: PickedKeys[number]) =>
      arbitraries[key].map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (u: any) =>
          ({
            [`${prefix}${capitalize(key)}`]: u,
          }) as Schema.Struct.Type<PrefixedFields>
      )
    )

  Object.assign(DatatypeMixin, {
    [`all${capitalize(prefix)}Keys`]: (): ReadonlyArray<keyof FieldType> =>
      optionKeys,
    [`arbitrary${capitalize(prefix)}OneOrNone`]: arbitraryOneOrNone,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Schema.declare<any>((_input: unknown): _input is any => true)
      ),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any
