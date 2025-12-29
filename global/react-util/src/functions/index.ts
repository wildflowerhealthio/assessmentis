export const cn = (
  ...args: Array<string | undefined | null | false | Record<string, boolean>>
): string => {
  const result: string[] = []
  for (const a of args) {
    if (!a) continue
    if (typeof a === 'string') {
      result.push(a)
    } else if (typeof a === 'object') {
      for (const [className, enabled] of Object.entries(a)) {
        if (enabled) result.push(className)
      }
    }
  }
  return result.join(' ')
}

export const applyPartialProps =
  <Outer extends object, Inner extends object>(
    Component: React.FC<Outer & Inner>,
    outerProps: Outer
  ): React.FC<Inner> =>
  (innerProps: Inner) =>
    Component({ ...outerProps, ...innerProps })

export const transformProps =
  <Outer extends object, Inner extends object>(
    Component: React.FC<Inner>,
    transform: (outer: Outer) => Inner
  ): React.FC<Outer> =>
  (outerProps: Outer) =>
    Component({ ...transform(outerProps) })
