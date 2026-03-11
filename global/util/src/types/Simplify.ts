/**
 * Flattens complex intersection types (e.g. `A & B & C`) into a single
 * mapped type so that IDE hover information shows a clean object shape
 * instead of a chain of `&` intersections.
 */
export type Simplify<T> = { [K in keyof T]: T[K] } & {}
