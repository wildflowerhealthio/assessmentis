import { Resource } from '@assessmentis/effectful-store'
import type { ClinicalDataRepositoryErrors } from './types'
import type { ResourceType } from './ResourceDataTypes'
import type {
  Composition,
  Questionnaire,
  QuestionnaireResponse,
} from './content-management'
import type {
  Encounter,
  Location,
  Patient,
  Practitioner,
} from './administration'
import type { Media, Observation } from './diagnostic-medicine'

type AbstractTypes = {
  [K in ResourceType]: {
    resourceType: K
    id?: string | undefined
  }
}

export interface Types extends AbstractTypes {
  Composition: Composition
  Encounter: Encounter
  Location: Location
  Media: Media
  Observation: Observation
  Patient: Patient
  Practitioner: Practitioner
  Questionnaire: Questionnaire
  QuestionnaireResponse: QuestionnaireResponse
}

export type Args = {
  [T in Types[keyof Types] as T['resourceType']]: Resource.Args<
    T['resourceType'],
    T
  >
}

export type Results = {
  [T in Types[keyof Types] as T['resourceType']]: Resource.Results<
    T['resourceType'],
    T
  >
}

export type Errors = {
  [T in Types[keyof Types] as T['resourceType']]: Resource.Errors<
    T['resourceType'],
    T,
    ClinicalDataRepositoryErrors
  >
}

export type Requests = {
  [T in Types[keyof Types] as T['resourceType']]: Resource.Requests<
    T['resourceType'],
    T,
    ClinicalDataRepositoryErrors
  >
}

export type RequestConstructors = {
  [T in Types[keyof Types] as T['resourceType']]: Resource.RequestConstructors<
    T['resourceType'],
    T,
    ClinicalDataRepositoryErrors
  >
}

const makeClinicalRequestConstructors = <T extends Types[keyof Types]>(
  resourceType: T['resourceType']
) =>
  Resource.constructors<T['resourceType'], T, ClinicalDataRepositoryErrors>(
    resourceType
  )

export const constructors: RequestConstructors = {
  Composition: makeClinicalRequestConstructors('Composition'),
  Encounter: makeClinicalRequestConstructors('Encounter'),
  Location: makeClinicalRequestConstructors('Location'),
  Media: makeClinicalRequestConstructors('Media'),
  Observation: makeClinicalRequestConstructors('Observation'),
  Patient: makeClinicalRequestConstructors('Patient'),
  Practitioner: makeClinicalRequestConstructors('Practitioner'),
  Questionnaire: makeClinicalRequestConstructors('Questionnaire'),
  QuestionnaireResponse: makeClinicalRequestConstructors(
    'QuestionnaireResponse'
  ),
}
