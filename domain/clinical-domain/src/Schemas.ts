import {
  Encounter,
  LocationFromFhirR4,
  Patient,
  Practitioner,
} from './administration'
import {
  Composition,
  Questionnaire,
  QuestionnaireResponse,
} from './content-management'
import { Media, Observation } from './diagnostic-medicine'

const Schemas = {
  Composition,
  Encounter,
  Location: LocationFromFhirR4,
  Media,
  Observation,
  Patient,
  Practitioner,
  Questionnaire,
  QuestionnaireResponse,
} as const

export default Schemas
