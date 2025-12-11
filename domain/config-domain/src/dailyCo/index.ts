import { Schema } from 'effect'

export const DailyCoProxyConfig = Schema.TaggedStruct('daily_co_proxy', {
  dailyCoProxyUrl: Schema.String,
})
export type DailyCoProxyConfig = typeof DailyCoProxyConfig.Type
