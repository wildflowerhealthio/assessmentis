/** Data needed to render a resource as a selectable item in a picker control. */
export interface PickerItemProps {
  /** Unique identifier for the picker option (typically the resource URL). */
  readonly id: string
  /** Primary display text shown in the picker. */
  readonly display: string
  /** Secondary detail text shown beneath the display text. */
  readonly secondary: string
}

/** Instance-level PickerItem trait — each instance provides its picker display data. */
export interface PickerItemInstance {
  PickerItem: PickerItemProps
}

/**
 * Constructor-level PickerItem constraint — the class exposes static picker
 * configuration (placeholder text and label).
 */
export interface PickerItemConstructor {
  PickerItem: {
    Placeholder: string
    Label: string
  }
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): PickerItemInstance
}
