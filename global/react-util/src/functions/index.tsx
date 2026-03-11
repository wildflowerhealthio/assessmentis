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
 * HOC that pre-fills a subset of a component's props.
 *
 * @typeParam Props - The full props type of the wrapped component
 * @typeParam Fixed - The subset of props to pre-fill (must be assignable to `Partial<Props>`)
 * @param Component - The component to wrap
 * @param fixedProps - Props that are baked in and never passed by the consumer
 * @returns A new `memo`'d component that accepts `Omit<Props, keyof Fixed>`
 *
 * @remarks
 * Fixed props are shallow-merged at render time, so dynamic props can
 * override fixed ones if their keys overlap. The wrapper is given a
 * descriptive `displayName` for React DevTools.
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
 * HOC that transforms incoming props before passing them to the wrapped component.
 *
 * @typeParam Outer - The props the consumer passes in
 * @typeParam Inner - The props the wrapped component expects
 * @param Component - The component to wrap
 * @param transform - Pure function mapping `Outer` props to `Inner` props
 * @returns A new `memo`'d component that accepts `Outer` props
 *
 * @remarks
 * Useful for adapting a generic component to a domain-specific props
 * shape without an intermediate wrapper component.
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
