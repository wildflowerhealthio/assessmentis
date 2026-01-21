export type NotEmpty<T> = keyof T extends never ? never : T
