import type { Schema } from 'effect'
import {
  EncounterFromFhirR4,
  LocationFromFhirR4,
  PatientFromFhirR4,
  PractitionerFromFhirR4,
} from './administration'
import {
  CompositionFromFhirR4,
  QuestionnaireFromFhirR4,
  QuestionnaireResponseFromFhirR4,
} from './content-management'
import { MediaFromFhirR4, ObservationFromFhirR4 } from './diagnostic-medicine'
import type { DeepReadonly } from '@assessmentis/util'
import type ResourceDataTypes from './ResourceDataTypes'
import type FhirResourceDataTypes from './FhirResourceDataTypes'

const Schemas: {
  [K in keyof ResourceDataTypes]: Schema.Schema<
    ResourceDataTypes[K],
    DeepReadonly<FhirResourceDataTypes[K]>,
    never
  >
} = {
  Composition: CompositionFromFhirR4,
  Encounter: EncounterFromFhirR4,
  Location: LocationFromFhirR4,
  Media: MediaFromFhirR4,
  Observation: ObservationFromFhirR4,
  Patient: PatientFromFhirR4,
  Practitioner: PractitionerFromFhirR4,
  Questionnaire: QuestionnaireFromFhirR4,
  QuestionnaireResponse: QuestionnaireResponseFromFhirR4,
}

export default Schemas
