import { Schema } from 'effect'

import type { EncounterClassHistoryEncoded } from '@assessmentis/clinical-domain'
import { mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/backbone-element'
import { FhirR4Coding } from '../../data-types/complex/coding'
import { FhirR4Period } from '../../data-types/complex/period'
import type { BaseUrl } from '../../data-types/url-identification'

export const EncounterClassHistoryEncodedFromFhir: Schema.Schema<
  EncounterClassHistoryEncoded,
  FhirR4.EncounterClassHistory,
  BaseUrl
> = Schema.extend(
  BackboneElementEncodedFromFhir('EncounterClassHistory'),
  mutableEncoded(
    Schema.Struct({
      class: Schema.suspend(() => FhirR4Coding.EncodedFromExternal),
      period: Schema.suspend(() => FhirR4Period.EncodedFromExternal),
    })
  )
)
