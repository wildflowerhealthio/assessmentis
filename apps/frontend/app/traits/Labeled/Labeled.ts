export interface LabeledProps {
  readonly singularLabel: string
  readonly pluralLabel: string
}

export interface LabeledConstructor {
  Labeled: LabeledProps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): unknown
}
