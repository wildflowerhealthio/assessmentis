import { Schema } from 'effect'
import { AllDatatypeKeys, DatatypeChoice } from '../Datatype'
import { Extension } from './Extension'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ValueMixin = DatatypeChoice('value', [...AllDatatypeKeys])
type ValueFields = Schema.Struct.Type<typeof ValueMixin.fields>

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
