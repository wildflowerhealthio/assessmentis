export interface PickerItemProps {
  readonly id: string
  readonly display: string
  readonly secondary: string
}

export interface PickerItemInstance {
  PickerItem: PickerItemProps
}

export interface PickerItemConstructor {
  PickerItem: {
    Placeholder: string
    Label: string
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): PickerItemInstance
}
