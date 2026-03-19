import { Schema } from 'effect'

import { Location } from '@assessmentis/clinical-domain'
import type { LocationEncoded } from '@assessmentis/clinical-domain'
import { ThreeStepExternalSchema } from '@assessmentis/util'

import { ApiDailyCoRoomSchema } from '../../models/api-daily-co-room-schema'

const EncodedFromDailyCoRoom: Schema.Schema<LocationEncoded, typeof ApiDailyCoRoomSchema.Type> =
  Schema.Struct({
    domainType: Schema.optional(Schema.Literal('Location')),
    mode: Schema.optional(Schema.Literal('instance', 'kind')),
    name: Schema.optional(Schema.String),
    status: Schema.optional(Schema.Literal('active', 'suspended', 'inactive')),
    url: Schema.optional(Schema.String),
  })

export const DailyCoLocation = new ThreeStepExternalSchema<
  Location,
  LocationEncoded,
  typeof ApiDailyCoRoomSchema.Type,
  typeof ApiDailyCoRoomSchema.Encoded,
  never
>(Location, ApiDailyCoRoomSchema, EncodedFromDailyCoRoom)
