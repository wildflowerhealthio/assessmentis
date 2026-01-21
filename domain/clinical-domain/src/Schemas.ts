import { Encounter, Patient, Practitioner } from './administration'
import {
  Composition,
  Questionnaire,
  QuestionnaireResponse,
} from './content-management'
import { Media, Observation } from './diagnostic-medicine'

const Schemas = {
  Composition,
  Encounter,
  Media,
  Observation,
  Patient,
  Practitioner,
  Questionnaire,
  QuestionnaireResponse,
} as const

export default Schemas
