import { memo } from 'react'

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

export function applyPartialProps<
  Props extends object,
  Fixed extends Partial<Props>,
>(
  Component: React.ComponentType<Props>,
  fixedProps: Fixed
): React.FC<Omit<Props, keyof Fixed>> {
  const Wrapped = memo((dynamicProps: Omit<Props, keyof Fixed>) => {
    const merged = { ...fixedProps, ...dynamicProps } as unknown as Props
    return <Component {...merged} />
  })
  Wrapped.displayName = `applyPartialProps(${(Component as { displayName?: string }).displayName || Component.name || 'Component'})`
  return Wrapped as React.FC<Omit<Props, keyof Fixed>>
}

export const transformProps = <Outer extends object, Inner extends object>(
  Component: React.ComponentType<Inner>,
  transform: (outer: Outer) => Inner
): React.FC<Outer> => {
  const Wrapped = memo((outerProps: Outer) => (
    <Component {...transform(outerProps)} />
  ))
  Wrapped.displayName = `transformProps(${(Component as { displayName?: string }).displayName || Component.name || 'Component'})`
  return Wrapped as React.FC<Outer>
}
