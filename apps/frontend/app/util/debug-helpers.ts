/**
 * Determines whether raw data should be displayed based on environment
 * @param data - The data to potentially display
 * @returns true if in development mode and data is defined
 */
export function shouldShowRawData(data: unknown): boolean {
  return import.meta.env.DEV && data !== undefined
}
