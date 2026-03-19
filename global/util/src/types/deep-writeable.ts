/** Strips `readonly` from all top-level properties of `T`. */
export type Writeable<T> = { -readonly [P in keyof T]: T[P] }

/** Recursively strips `readonly` from every property of `T` at all depths. */
export type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> }
