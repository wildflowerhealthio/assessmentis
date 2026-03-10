import { codings } from './codings'
import { baseChoiceObservation, type ObservationTemplate } from './internal'

export const totalScore = {
  ...baseChoiceObservation,
  code: {
    coding: [codings.totalScore],
    text: codings.totalScore.display,
  },
  method: {
    text: 'This is calculated by assigning scores of 0, 1, 2, and 3 to the response categories, respectively, of “not at all,” “several days,” “more than half the days,” and “nearly every day.” GAD-7 total score for the seven items ranges from 0 to 21.',
  },
  referenceRange: [
    { low: { value: 0 }, high: { value: 4 }, text: 'minimal anxiety' },
    { low: { value: 5 }, high: { value: 9 }, text: 'mild anxiety' },
    { low: { value: 10 }, high: { value: 14 }, text: 'moderate anxiety' },
    { low: { value: 15 }, high: { value: 21 }, text: 'severe anxiety' },
  ],
} as const satisfies ObservationTemplate

export const feelingNervousObservation = {
  ...baseChoiceObservation,
  code: {
    coding: [codings.feelingNervous],
    text: codings.feelingNervous.display,
  },
} as const satisfies ObservationTemplate

export const notAbleToStopWorryingObservation = {
  ...baseChoiceObservation,
  code: {
    coding: [codings.notAbleToStopWorrying],
    text: codings.notAbleToStopWorrying.display,
  },
} as const satisfies ObservationTemplate

export const worryingTooMuchObservation = {
  ...baseChoiceObservation,
  code: {
    coding: [codings.worryingTooMuch],
    text: codings.worryingTooMuch.display,
  },
} as const satisfies ObservationTemplate

export const troubleRelaxingObservation = {
  ...baseChoiceObservation,
  code: {
    coding: [codings.troubleRelaxing],
    text: codings.troubleRelaxing.display,
  },
} as const satisfies ObservationTemplate

export const restlessHardToSitStillObservation = {
  ...baseChoiceObservation,
  code: {
    coding: [codings.restlessHardToSitStill],
    text: codings.restlessHardToSitStill.display,
  },
} as const satisfies ObservationTemplate

export const easilyAnnoyedObservation = {
  ...baseChoiceObservation,
  code: {
    coding: [codings.easilyAnnoyed],
    text: codings.easilyAnnoyed.display,
  },
} as const satisfies ObservationTemplate

export const feelingAfraidObservation = {
  ...baseChoiceObservation,
  code: {
    coding: [codings.feelingAfraid],
    text: codings.feelingAfraid.display,
  },
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
