import type { Schema } from 'effect'
import { Encounter, Location, Patient, Practitioner } from './administration'
import {
  Composition,
  Questionnaire,
  QuestionnaireResponse,
} from './content-management'
import { Media, Observation } from './diagnostic-medicine'
import type ResourceDataTypes from './ResourceDataTypes'

const Schemas = {
  Composition: Composition.Schema,
  Encounter: Encounter.Schema,
  Location: Location.Schema,
  Media: Media.Schema,
  Observation: Observation.Schema,
  Patient: Patient.Schema,
  Practitioner: Practitioner.Schema,
  Questionnaire: Questionnaire.Schema,
  QuestionnaireResponse: QuestionnaireResponse.Schema,
} as const satisfies {
  [K in keyof ResourceDataTypes]: Schema.Schema<
    ResourceDataTypes[K],
    any,
    never
  >
}

export default Schemas
