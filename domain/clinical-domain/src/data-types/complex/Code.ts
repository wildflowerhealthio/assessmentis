import { Schema } from 'effect'

export const Code = Schema.String.pipe(Schema.brand('code'))
export type Code<Value extends string = string> = typeof Code.Type & Value
