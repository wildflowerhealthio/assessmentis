import { Code, Coding } from '@assessmentis/clinical-domain/data-types'
import { literalOf } from '@assessmentis/util'
import type { Brand } from 'effect'

const codeLiteral = literalOf(Code)

/**
 * Creates a Coding with narrowed `code` and `display` types.
 * Centralizes the single unavoidable cast that Coding.make() requires
 * because its return type widens optional fields.
 */

const literalCoding = <C extends string & Brand.Brand<'code'>>(params: {
  system: string
  code: Brand.Brand.Unbranded<C>
  display: string
}): Coding & { code: Code<C>; display: string } =>
  Coding.make({
    system: params.system,
    code: codeLiteral<C>(params.code),
    display: params.display,
  }) as Coding & { code: Code<C>; display: string }

export const codings = {
  totalScore: literalCoding({
    system: 'http://loinc.org',
    code: '70274-6',
    display: 'Generalized anxiety disorder 7 item (GAD-7) total score',
  }),
  questionnaire: literalCoding({
    system: 'http://loinc.org',
    code: '69737-5',
    display: 'Generalized anxiety disorder 7 item (GAD-7)',
  }),
  feelingNervous: literalCoding({
    system: 'http://loinc.org',
    code: '69725-0',
    display: 'Feeling nervous, anxious or on edge',
  }),
  worryingTooMuch: literalCoding({
    system: 'http://loinc.org',
    code: '69733-4',
    display: 'Worrying too much about different things',
  }),
  troubleRelaxing: literalCoding({
    system: 'http://loinc.org',
    code: '69734-2',
    display: 'Trouble relaxing',
  }),
  restlessHardToSitStill: literalCoding({
    system: 'http://loinc.org',
    code: '69735-9',
    display: 'Being so restless that it is hard to sit still',
  }),
  easilyAnnoyed: literalCoding({
    system: 'http://loinc.org',
    code: '69689-8',
    display: 'Becoming easily annoyed or irritable.',
  }),
  feelingAfraid: literalCoding({
    system: 'http://loinc.org',
    code: '69736-7',
    display: 'Feeling afraid as if something awful might happen',
  }),
  notAtAll: literalCoding({
    system: 'http://loinc.org',
    code: 'LA6568-5',
    display: 'Not at all',
  }),
  severalDays: literalCoding({
    system: 'http://loinc.org',
    code: 'LA6569-3',
    display: 'Several days',
  }),
  moreThanHalfTheDays: literalCoding({
    system: 'http://loinc.org',
    code: 'LA6570-1',
    display: 'More than half the days',
  }),
  nearlyEveryDay: literalCoding({
    system: 'http://loinc.org',
    code: 'LA6571-9',
    display: 'Nearly every day',
  }),
  notAbleToStopWorrying: literalCoding({
    system: 'http://loinc.org',
    code: '68509-9',
    display: 'Not able to stop or control worrying in the last 2 weeks',
  }),
  unitedStates: literalCoding({
    system: 'urn:iso:std:iso:3166',
    code: 'US',
    display: 'United States of America',
  }),
} as const satisfies Record<string, Coding>
