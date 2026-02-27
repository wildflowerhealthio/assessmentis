import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { EncounterClassHistoryEncoded } from '@assessmentis/clinical-domain'
import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4Coding } from '../../data-types/complex/Coding'
import { FhirR4Period } from '../../data-types/complex/Period'
import { mutableEncoded } from '@assessmentis/util'
import type { BaseUrl } from '../../data-types/UrlIdentification'

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
