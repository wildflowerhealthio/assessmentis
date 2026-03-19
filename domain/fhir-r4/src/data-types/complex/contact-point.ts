import { Schema } from 'effect'

import { ContactPoint } from '@assessmentis/clinical-domain/data-types'
import type { ContactPointEncoded } from '@assessmentis/clinical-domain/data-types'
import { TwoStepExternalSchema, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import type { BaseUrl } from '../url-identification'
import { FhirR4Period } from './period'

const EncodedFromFhir: Schema.Schema<ContactPointEncoded, FhirR4.ContactPoint, BaseUrl> =
  mutableEncoded(
    Schema.Struct({
      period: Schema.optional(Schema.suspend(() => FhirR4Period.EncodedFromExternal)),
      rank: Schema.optional(Schema.Number),
      system: Schema.optional(
        Schema.Union(
          Schema.Literal('phone'),
          Schema.Literal('fax'),
          Schema.Literal('email'),
          Schema.Literal('pager'),
          Schema.Literal('url'),
          Schema.Literal('sms'),
          Schema.Literal('other')
        )
      ),
      use: Schema.optional(
        Schema.Union(
          Schema.Literal('home'),
          Schema.Literal('work'),
          Schema.Literal('temp'),
          Schema.Literal('old'),
          Schema.Literal('mobile')
        )
      ),
      value: Schema.optional(Schema.String),
    })
  )

export const FhirR4ContactPoint = new TwoStepExternalSchema(ContactPoint, EncodedFromFhir)
