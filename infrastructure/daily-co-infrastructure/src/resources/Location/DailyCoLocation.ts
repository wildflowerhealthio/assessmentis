import { ThreeStepExternalSchema } from '@assessmentis/util'
import type { LocationEncoded } from '@assessmentis/clinical-domain'
import { Location } from '@assessmentis/clinical-domain'
import { Schema } from 'effect'
import { ApiDailyCoRoomSchema } from '../../models/ApiDailyCoRoomSchema'
import {} from '@assessmentis/clinical-domain'

const EncodedFromDailyCoRoom: Schema.Schema<
  LocationEncoded,
  typeof ApiDailyCoRoomSchema.Type
> = Schema.Struct({
  domainType: Schema.Literal('Location').pipe(
    Schema.optionalWith({ default: () => 'Location' })
  ),
  name: Schema.String,
  status: Schema.Literal('active').pipe(
    Schema.optionalWith({ default: () => 'active' })
  ),
  mode: Schema.Literal('instance').pipe(
    Schema.optionalWith({ default: () => 'instance' })
  ),
})

export const DailyCoLocation = new ThreeStepExternalSchema<
  Location,
  LocationEncoded,
  typeof ApiDailyCoRoomSchema.Type,
  typeof ApiDailyCoRoomSchema.Encoded,
  never
>(Location, ApiDailyCoRoomSchema, EncodedFromDailyCoRoom)
