import type { LabeledConstructor } from '../Labeled/labeled'

/**
 * Sets the static `PickerItem` property on a class using its `Labeled`
 * trait as defaults. Individual implementations can pass overrides.
 */
export function applyPickerStatics(
  klass: LabeledConstructor & { prototype: object },
  overrides?: { Placeholder?: string; Label?: string }
): void {
  Object.defineProperty(klass, 'PickerItem', {
    configurable: true,
    value: {
      Placeholder:
        overrides?.Placeholder ?? `Select a ${klass.Labeled.singularLabel.toLowerCase()}...`,
      Label: overrides?.Label ?? klass.Labeled.singularLabel,
    },
  })
}
