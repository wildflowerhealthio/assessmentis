/**
 * Builds URLSearchParams from a record, filtering out undefined values
 * @param params - Record of search parameters
 * @returns URLSearchParams instance with only defined values
 */
export const buildSearchParams = (
  params: Record<string, string | undefined>
): URLSearchParams => {
  return new URLSearchParams(
    Object.entries(params).filter(
      (pair): pair is [string, string] => pair[1] !== undefined
    )
  )
}
