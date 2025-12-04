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
