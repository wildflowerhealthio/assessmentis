import { Code, type Coding } from '@assessmentis/clinical-domain/data-types'
import { literalOf } from '@assessmentis/util'

const codeLiteral = literalOf(Code)

export const codings = {
  totalScore: {
    system: 'http://loinc.org',
    code: codeLiteral('70274-6'),
    display: 'Generalized anxiety disorder 7 item (GAD-7) total score',
  },
  questionnaire: {
    system: 'http://loinc.org',
    code: codeLiteral('69737-5'),
    display: 'Generalized anxiety disorder 7 item (GAD-7)',
  },
  feelingNervous: {
    system: 'http://loinc.org',
    code: codeLiteral('69725-0'),
    display: 'Feeling nervous, anxious or on edge',
  },
  worryingTooMuch: {
    system: 'http://loinc.org',
    code: codeLiteral('69733-4'),
    display: 'Worrying too much about different things',
  },
  troubleRelaxing: {
    system: 'http://loinc.org',
    code: codeLiteral('69734-2'),
    display: 'Trouble relaxing',
  },
  restlessHardToSitStill: {
    system: 'http://loinc.org',
    code: codeLiteral('69735-9'),
    display: 'Being so restless that it is hard to sit still',
  },
  easilyAnnoyed: {
    system: 'http://loinc.org',
    code: codeLiteral('69689-8'),
    display: 'Becoming easily annoyed or irritable.',
  },
  feelingAfraid: {
    system: 'http://loinc.org',
    code: codeLiteral('69736-7'),
    display: 'Feeling afraid as if something awful might happen',
  },
  notAtAll: {
    system: 'http://loinc.org',
    code: codeLiteral('LA6568-5'),
    display: 'Not at all',
  },
  severalDays: {
    system: 'http://loinc.org',
    code: codeLiteral('LA6569-3'),
    display: 'Several days',
  },
  moreThanHalfTheDays: {
    system: 'http://loinc.org',
    code: codeLiteral('LA6570-1'),
    display: 'More than half the days',
  },
  nearlyEveryDay: {
    system: 'http://loinc.org',
    code: codeLiteral('LA6571-9'),
    display: 'Nearly every day',
  },
  notAbleToStopWorrying: {
    system: 'http://loinc.org',
    code: codeLiteral('68509-9'),
    display: 'Not able to stop or control worrying in the last 2 weeks',
  },
  unitedStates: {
    system: 'urn:iso:std:iso:3166',
    code: codeLiteral('US'),
    display: 'United States of America',
  },
} as const satisfies Record<string, Coding>
