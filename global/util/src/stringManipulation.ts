/** Uppercase the first character of a string, preserving the literal type via `Capitalize<T>`. */
export const capitalize = <T extends string>(s: T): Capitalize<T> => {
  return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<T>
}
