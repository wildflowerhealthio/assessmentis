import {
  CodeableConcept,
  Quantity,
} from '@assessmentis/clinical-domain/data-types'
import codings from './codings'
import type { ObservationTemplate } from './internal'
import { baseChoiceObservation } from './internal'
import { ObservationReferenceRange } from '@assessmentis/clinical-domain'

export const totalScore = {
  ...baseChoiceObservation,
  code: CodeableConcept.make({
    coding: [codings.totalScore],
    text: codings.totalScore.display,
  }),
  method: CodeableConcept.make({
    coding: [codings.totalScore],
    text: 'This is calculated by assigning scores of 0, 1, 2, and 3 to the response categories, respectively, of “not at all,” “several days,” “more than half the days,” and “nearly every day.” GAD-7 total score for the seven items ranges from 0 to 21.',
  }),
  referenceRange: [
    ObservationReferenceRange.make({
      low: Quantity.make({ value: 0 }),
      high: Quantity.make({ value: 4 }),
      text: 'minimal anxiety',
    }),
    ObservationReferenceRange.make({
      low: Quantity.make({ value: 5 }),
      high: Quantity.make({ value: 9 }),
      text: 'mild anxiety',
    }),
    ObservationReferenceRange.make({
      low: Quantity.make({ value: 10 }),
      high: Quantity.make({ value: 14 }),
      text: 'moderate anxiety',
    }),
    ObservationReferenceRange.make({
      low: Quantity.make({ value: 15 }),
      high: Quantity.make({ value: 21 }),
      text: 'severe anxiety',
    }),
  ],
} as const satisfies ObservationTemplate

export const feelingNervousObservation = {
  ...baseChoiceObservation,
  code: CodeableConcept.make({
    coding: [codings.feelingNervous],
    text: codings.feelingNervous.display,
  }),
} as const satisfies ObservationTemplate

export const notAbleToStopWorryingObservation = {
  ...baseChoiceObservation,
  code: CodeableConcept.make({
    coding: [codings.notAbleToStopWorrying],
    text: codings.notAbleToStopWorrying.display,
  }),
} as const satisfies ObservationTemplate

export const worryingTooMuchObservation = {
  ...baseChoiceObservation,
  code: CodeableConcept.make({
    coding: [codings.worryingTooMuch],
    text: codings.worryingTooMuch.display,
  }),
} as const satisfies ObservationTemplate

export const troubleRelaxingObservation = {
  ...baseChoiceObservation,
  code: CodeableConcept.make({
    coding: [codings.troubleRelaxing],
    text: codings.troubleRelaxing.display,
  }),
} as const satisfies ObservationTemplate

export const restlessHardToSitStillObservation = {
  ...baseChoiceObservation,
  code: CodeableConcept.make({
    coding: [codings.restlessHardToSitStill],
    text: codings.restlessHardToSitStill.display,
  }),
} as const satisfies ObservationTemplate

export const easilyAnnoyedObservation = {
  ...baseChoiceObservation,
  code: CodeableConcept.make({
    coding: [codings.easilyAnnoyed],
    text: codings.easilyAnnoyed.display,
  }),
} as const satisfies ObservationTemplate

export const feelingAfraidObservation = {
  ...baseChoiceObservation,
  code: CodeableConcept.make({
    coding: [codings.feelingAfraid],
    text: codings.feelingAfraid.display,
  }),
} as const satisfies ObservationTemplate

export const questionObservations = {
  feelingNervousObservation,
  notAbleToStopWorryingObservation,
  worryingTooMuchObservation,
  troubleRelaxingObservation,
  restlessHardToSitStillObservation,
  easilyAnnoyedObservation,
  feelingAfraidObservation,
} as const
