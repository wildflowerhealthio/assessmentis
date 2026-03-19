import { SchemaAST } from 'effect'
import { IdentifierAnnotationId } from 'effect/SchemaAST'
import type React from 'react'

import { Org } from '@assessmentis/platform-domain'

import type {
  BooleanProperty,
  FieldProps,
  MapProperty,
  NumberProperty,
  PropertyBuilder,
  StringProperty,
} from '@firecms/core'
import { buildCollection, buildProperty, useModeController } from '@firecms/core'

import { EditableJsonView } from './editable-json-view'

/* oxlint-disable react/only-export-components */

type PropertySets =
  | MapProperty
  | StringProperty
  | NumberProperty
  | BooleanProperty
  | PropertyBuilder

function SimpleSelectField({
  property,
  value,
  setValue,
  customProps: _customProps,
  includeDescription: _includeDescription,
  showError: _showError,
  error,
  isSubmitting,
  context: _context,
}: FieldProps<string, Record<string, never>>): React.JSX.Element {
  const { mode: _mode } = useModeController()
  const style = { padding: 8, paddingLeft: 32 }
  return (
    <select
      style={error ? { borderColor: 'red', ...style } : style}
      disabled={isSubmitting}
      value={value ?? ''}
      onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
        setValue(evt.target.value)
      }}
    >
      {/* oxlint-disable-next-line typescript/no-unsafe-type-assertion */}
      {((property.enumValues ?? []) as { id: string | number; label: string }[])?.map((ev) => (
        <option key={ev.id} value={ev.id}>
          {ev.label}
        </option>
      ))}
    </select>
  )
}

const asFireCmsProperty = (name: string, s: SchemaAST.AST): PropertySets => {
  if (SchemaAST.isTypeLiteral(s)) {
    const properties: Record<string, PropertySets> = {}

    for (const property of s.propertySignatures) {
      const propertyName = property.name
      if (!propertyName || typeof propertyName !== 'string') {
        throw new Error('Expected property signature to have a name')
      }
      properties[propertyName] = asFireCmsProperty(propertyName, property.type)
    }

    return buildProperty({
      dataType: 'map',
      name,
      properties,
    })
  } else if (SchemaAST.isUnion(s)) {
    if (
      s.types.length === 2 &&
      s.types.some(
        (t) => SchemaAST.isUndefinedKeyword(t) || (SchemaAST.isLiteral(t) && t.literal === null)
      )
    ) {
      const definedType = s.types.find((t) => !SchemaAST.isUndefinedKeyword(t))!
      return asFireCmsProperty(name, definedType)
    }

    const tags = s.types.map((typeAst) => {
      if (SchemaAST.isTypeLiteral(typeAst)) {
        const tagAst = typeAst.propertySignatures.find((p) => p.name === '_tag')
        if (tagAst && SchemaAST.isLiteral(tagAst.type) && typeof tagAst.type.literal === 'string') {
          return tagAst.type.literal
        }
        throw new Error('Expected union member to have a _tag literal')
      } else {
        throw new Error(`Expected union member to be a type literal ${name} is an ${typeAst._tag}`)
      }
    })

    return ({ propertyValue }) => {
      const tagIndex =
        propertyValue && '_tag' in propertyValue ? tags.indexOf(propertyValue._tag) : -1
      const taggedValueAst = s.types[tagIndex]
      const taggedElementProperties =
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        (taggedValueAst && (asFireCmsProperty(name, taggedValueAst) as MapProperty)?.properties) ??
        {}

      const property = buildProperty({
        dataType: 'map',
        name,
        properties: {
          ...taggedElementProperties,
          _tag: buildProperty({
            Field: SimpleSelectField,
            dataType: 'string',
            enumValues: tags.map((tag) => ({ id: tag, label: tag }) as const),
            name: '_tag',
            previewAsTag: true,
          }),
        },
      })
      return property
    }
  } else if (SchemaAST.isLiteral(s)) {
    const literalHandlers: Record<
      string,
      (() => StringProperty | NumberProperty | BooleanProperty) | undefined
    > = {
      boolean: () =>
        buildProperty({
          dataType: 'boolean',
          name: name,
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          defaultValue: s.literal as boolean,
        }),
      number: () =>
        buildProperty({
          dataType: 'number',
          name: name,
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          defaultValue: s.literal as number,
        }),
      string: () =>
        buildProperty({
          dataType: 'string',
          name: name,
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          defaultValue: s.literal as string,
        }),
    }
    const literalValue = literalHandlers[typeof s.literal]

    if (!literalValue) {
      throw new Error(`Unsupported literal type: ${typeof s.literal} in ${name}`)
    }
    return literalValue()
  } else if (SchemaAST.isStringKeyword(s)) {
    return buildProperty({
      dataType: 'string',
      name: name,
    })
  } else if (SchemaAST.isNumberKeyword(s)) {
    return buildProperty({
      dataType: 'number',
      name: name,
    })
  } else if (SchemaAST.isBooleanKeyword(s)) {
    return buildProperty({
      dataType: 'boolean',
      name: name,
    })
  } else if (
    SchemaAST.isTransformation(s) &&
    (s.annotations[IdentifierAnnotationId] === 'DateTimeUtc' ||
      s.annotations[IdentifierAnnotationId] === 'DateTime')
  ) {
    return buildProperty({
      dataType: 'string',
      name: name,
    })
  }

  throw new Error(`Unsupported schema AST type: ${s.toString()}`)
}
console.log('Org AST:', Org.ast)

console.log('Org Props:', asFireCmsProperty('Org', Org.ast))

// This is a demo collection with many of the available properties
export const orgsCollection = buildCollection({
  databaseId: 'assessmentis',
  id: 'orgs',
  name: 'Client Orgs',
  description: 'This is a collection of orgs using assessmentis',
  path: 'orgs',
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  properties: (asFireCmsProperty('Org', Org.ast) as unknown as MapProperty).properties!,
  entityViews: [
    {
      Builder: EditableJsonView,
      key: 'editable_json',
      name: 'JSON Editor',
    },
  ],
})
