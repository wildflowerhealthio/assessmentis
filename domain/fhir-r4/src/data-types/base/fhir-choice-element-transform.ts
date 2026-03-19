import { Schema } from 'effect'

import { DatatypeChoice, baseDatatypes } from '@assessmentis/clinical-domain/data-types'
import type { DatatypeName } from '@assessmentis/clinical-domain/data-types'
import { capitalize } from '@assessmentis/util'

type DomainChoiceType<Prefix extends string, Names extends readonly DatatypeName[]> = Readonly<
  Partial<Record<Prefix, ReturnType<typeof DatatypeChoice<Names>>['Encoded'] | undefined>>
>

type DomainChoiceEncodedFlattened<Prefix extends string, Names extends readonly DatatypeName[]> = {
  [K in Names[number] as `${Prefix}${Capitalize<K>}`]?:
    | (typeof baseDatatypes)[K]['schema']['Encoded']
    | undefined
}

/**
 * Builds a schema that converts between FHIR R4's flat choice-element
 * encoding (`{ valueString: '...' }`) and the domain's {@link DatatypeChoice}
 * tagged union (`{ value: { _tag: 'string', string: '...' } }`).
 *
 * Performs structural wrapping only — individual values pass through as-is.
 * The domain layer's `DatatypeChoice` schemas handle value-level encoding.
 *
 * @param prefix - The choice element prefix (e.g. `'value'`, `'effective'`)
 * @param datatypeNames - Allowed data type names for this choice element
 */
export function FhirChoiceElementTransform<
  const Prefix extends string,
  const Names extends readonly DatatypeName[],
>(
  prefix: Prefix,
  datatypeNames: Names
): Schema.Schema<DomainChoiceType<Prefix, Names>, DomainChoiceEncodedFlattened<Prefix, Names>> {
  type TFlatEncoded = DomainChoiceEncodedFlattened<Prefix, Names>
  type TDomainChoiceType = DomainChoiceType<Prefix, Names>

  // Encoded (FHIR) side: flat optional keys like { valueString?: ..., valueQuantity?: ... }
  // Object.fromEntries loses key precision → assert to the shape we know we're building.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const from = Schema.Struct(
    Object.fromEntries(
      datatypeNames.map((name) => [
        `${prefix}${capitalize(name)}`,
        // BaseDatatypes[name].schema is a union of concrete schema types that
        // EncodedSchema can't accept directly — widen to Schema<unknown, unknown>.
        Schema.optional(
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          Schema.encodedSchema(baseDatatypes[name].schema as Schema.Schema<unknown, unknown>)
        ),
      ])
    )
  ) as unknown as Schema.Schema<TFlatEncoded, TFlatEncoded>

  // Type (domain Encoded) side: { [prefix]?: DatatypeChoice.Encoded }
  // Computed property [prefix] loses the literal key type → assert to known shape.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const to = Schema.Struct({
    [prefix]: Schema.optional(Schema.encodedSchema(DatatypeChoice(datatypeNames))),
  }) as unknown as Schema.Schema<TDomainChoiceType, TDomainChoiceType>

  // With from/to correctly typed, Schema.transform infers the return type.
  return Schema.transform(from, to, {
    decode: (flat) => {
      // flat has template-literal keys; runtime iteration needs Record access.
      const record = flat as Record<string, unknown>
      for (const name of datatypeNames) {
        const flatKey = `${prefix}${capitalize(name)}`
        const rawValue = record[flatKey]
        if (rawValue !== undefined) {
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          return {
            [prefix]: { _tag: name, [name]: rawValue },
          } as TDomainChoiceType
        }
      }
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      return {} as TDomainChoiceType
    },
    encode: (tagged) => {
      // tagged has a generic Prefix key; runtime access needs Record.
      const record = tagged as Record<string, unknown>
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const choiceValue = record[prefix] as
        | { readonly _tag: string; readonly [k: string]: unknown }
        | undefined
      if (choiceValue === undefined) {
        return {} as TFlatEncoded
      }
      const tag = choiceValue._tag
      const val = choiceValue[tag]
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      return {
        [`${prefix}${capitalize(tag)}`]: val,
      } as TFlatEncoded
    },
    strict: true,
  })
}
