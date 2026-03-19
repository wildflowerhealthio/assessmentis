/** Human-readable singular and plural labels for a domain resource type. */
export interface LabeledProps {
  /** Singular form (e.g. "Patient"). */
  readonly singularLabel: string
  /** Plural form (e.g. "Patients"). */
  readonly pluralLabel: string
}

/** Constructor-level Labeled constraint — the class exposes static {@link LabeledProps}. */
export interface LabeledConstructor {
  Labeled: LabeledProps
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): unknown
}
