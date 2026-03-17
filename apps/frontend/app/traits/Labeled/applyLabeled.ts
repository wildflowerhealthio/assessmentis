import type { LabeledProps } from './Labeled'

/**
 * Applies the {@link LabeledProps} trait to a domain class as a static property.
 *
 * @param klass - The domain class constructor to augment
 * @param singularLabel - Human-readable singular name (e.g. "Patient")
 * @param pluralLabel - Human-readable plural name (e.g. "Patients")
 *
 * @remarks
 * Analogous to {@link applyPickerStatics} — reduces each per-resource
 * implementation file to a single call while the `declare module`
 * augmentations still live in the per-file declarations.
 */
export function applyLabeled(
  klass: { prototype: object },
  singularLabel: string,
  pluralLabel: string
): void {
  Object.defineProperty(klass, 'Labeled', {
    value: {
      singularLabel,
      pluralLabel,
    } satisfies LabeledProps,
    configurable: true,
  })
}
