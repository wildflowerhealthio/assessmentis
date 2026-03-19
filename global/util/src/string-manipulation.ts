/** Uppercase the first character of a string, preserving the literal type via `Capitalize<T>`. */
export const capitalize = <T extends string>(s: T): Capitalize<T> => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<T>
}
