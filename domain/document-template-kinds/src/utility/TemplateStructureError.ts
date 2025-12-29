import { Data } from 'effect'

export class TemplateStructureError extends Data.TaggedError(
  'TemplateStructureError'
)<{ message: string; group: string; invariant: string; component: string }> {
  constructor({
    path: [group, variant, component],
    invariant,
  }: {
    path: [string, string, string]
    invariant: string
  }) {
    super({
      message: `Template structure error in ${variant} ${group} ${component}: ${invariant}`,
      group,
      invariant,
      component,
    })
  }
}
