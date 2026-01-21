import { Context, Schema } from 'effect'

export const DailyCoSecret = Schema.Struct({
  apiKey: Schema.String,
})
export type DailyCoSecret = typeof DailyCoSecret.Type

export class LoadedDailyCoSecret extends Context.Tag('LoadedDailyCoSecret')<
  LoadedDailyCoSecret,
  DailyCoSecret
>() {}
