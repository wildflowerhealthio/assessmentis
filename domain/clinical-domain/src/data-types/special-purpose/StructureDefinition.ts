import { Schema } from 'effect'

import { AllDatatypeKeys, DatatypeChoice } from '../Datatype'
import { Extension } from './Extension'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class StructureDefinitionValue extends DatatypeChoice(
  'StructureDefinitionValue',
  'value',
  AllDatatypeKeys
) {}
type ValueFields = Schema.Struct.Type<typeof StructureDefinitionValue.fields>

/*
{
  "resourceType": "StructureDefinition",
  "url": "http://hl7.org/fhir/StructureDefinition/data-absent-reason",
  "name": "Data Absent Reason",
  "kind": "complex-type",
  "type": "Extension",
  "baseDefinition": "http://hl7.org/fhir/StructureDefinition/Extension"
}
*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StructureDefinitionKind = Schema.Enums({
  'primitive-type': 'primitive-type',
  'complex-type': 'complex-type',
  resource: 'resource',
  logical: 'logical',
})
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StructureDefinitionType = Schema.Enums({ Extension: 'Extension' })

/**
 * Describes a FHIR StructureDefinition for an Extension profile. Provides
 * `getValues` and `withValues` to read/write typed extension values on
 * resources without manually traversing the `extension` array.
 *
 * @typeParam FieldName - The value\[x\] field name this definition targets,
 *   or `null` if it carries no value (container-only extension)
 */
export class StructureDefinition<
  FieldName extends keyof ValueFields | null = null,
> {
  static readonly extensionBaseDefinitionUrl =
    'http://hl7.org/fhir/StructureDefinition/Extension'
  url: string
  name: string
  kind: typeof StructureDefinitionKind.Type
  type: typeof StructureDefinitionType.Type
  baseDefinition: string
  relevantField: FieldName

  constructor(args: {
    url: string
    name: string
    kind: typeof StructureDefinitionKind.Type
    type: typeof StructureDefinitionType.Type
    relevantField: FieldName
    baseDefinition: string
  }) {
    this.url = args.url
    this.name = args.name
    this.kind = args.kind
    this.type = args.type
    this.baseDefinition = args.baseDefinition
    this.relevantField = args.relevantField
  }

  /**
   * Extracts all values for this extension from a resource's `extension` array.
   *
   * @param resource - Any object with an `extension` array
   * @returns Array of typed values from matching extensions
   */
  getValues(resource: {
    extension?: ReadonlyArray<Extension>
  }): ReadonlyArray<ValueFields[NonNullable<FieldName>]> {
    const { relevantField } = this
    if (relevantField == null) return []
    if (!resource.extension) return []

    return resource.extension
      .filter((ext) => ext.definitionUrl === this.url && relevantField in ext)
      .map((ext): ValueFields[typeof relevantField] => ext[relevantField])
  }

  /**
   * Returns a copy of `resource` with its extension array updated to contain
   * the given values for this definition. Existing extensions with other URLs
   * are preserved; existing extensions with this URL are replaced.
   */
  withValues<
    T extends {
      extension?: ReadonlyArray<Extension>
    },
  >(
    resource: T,
    values: ReadonlyArray<ValueFields[NonNullable<FieldName>]>
  ): T {
    const { relevantField } = this
    if (relevantField == null) return resource
    const existingExtensions =
      resource.extension?.filter((ext) => ext.definitionUrl !== this.url) ?? []

    const newExtensions = [
      ...existingExtensions,
      ...values.map((value) =>
        Extension.make({
          definitionUrl: this.url,
          [relevantField]: value,
        })
      ),
    ]

    return {
      ...resource,
      extension: newExtensions,
    }
  }
}
