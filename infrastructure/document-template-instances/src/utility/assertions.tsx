import {
  JsxCompositionSection,
  TemplateStructureError,
} from '@assessmentis/document-template-kinds'
import { Effect } from 'effect'

export const assertNoChildren = ({
  children,
  path,
}: {
  children: undefined | JsxCompositionSection[]
  path: [string, string, string]
}): Effect.Effect<void, TemplateStructureError, never> => {
  if (children && children.length > 0) {
    return Effect.fail(
      new TemplateStructureError({
        path,
        invariant: 'Component cannot have children',
      })
    )
  }
  return Effect.succeed(undefined)
}

export const assertChildren = ({
  children,
  count,
  path,
}: {
  children: undefined | JsxCompositionSection[]
  count?: number | undefined
  path: [string, string, string]
}): Effect.Effect<void, TemplateStructureError, never> => {
  if (count == undefined) {
    if (children && children.length > 0) {
      return Effect.succeed(undefined)
    } else {
      return Effect.fail(
        new TemplateStructureError({
          path,
          invariant: 'Component must have some children',
        })
      )
    }
  }
  if (children && children.length == count) return Effect.succeed(undefined)

  return Effect.fail(
    new TemplateStructureError({
      path: ['common', 'base', 'Header'],
      invariant: `Component must have ${count} children`,
    })
  )
}

export const assertExists = ({
  value,
  name,
  path,
}: {
  value: unknown
  name: string
  path: [string, string, string]
}): Effect.Effect<void, TemplateStructureError, never> => {
  if (value == null || value === '' || value === undefined) {
    return Effect.fail(
      new TemplateStructureError({
        path,
        invariant: `Value for ${name} must exist`,
      })
    )
  }
  return Effect.succeed(undefined)
}
