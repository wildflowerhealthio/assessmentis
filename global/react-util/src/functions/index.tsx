import { memo } from 'react'

/**
 * Merges class name arguments into a single space-separated string.
 * Accepts strings, falsy values (ignored), and `Record<string, boolean>`
 * objects where keys are class names and values control inclusion.
 */
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

/**
 * HOC that pre-fills a subset of a component's props. The returned
 * component only requires the remaining (non-fixed) props.
 */
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

/**
 * HOC that transforms incoming props before passing them to the wrapped
 * component. The returned component accepts `Outer` props and renders
 * `Component` with the result of `transform(outer)`.
 */
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
