import { Schema } from 'effect'

export const Code = Schema.String.pipe(Schema.brand('code'))
export type Code = typeof Code.Type
