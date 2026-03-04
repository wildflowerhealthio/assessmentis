import { Coding } from '@assessmentis/clinical-domain/data-types'
import { Code } from '@assessmentis/clinical-domain/data-types'
import { literalOf } from '@assessmentis/util'

const codeLiteral = literalOf(Code)

export const codings = {
  totalScore: Coding.make({
    system: 'http://loinc.org',
    code: codeLiteral('70274-6'),
    display: 'Generalized anxiety disorder 7 item (GAD-7) total score',
  }) as Coding & { code: Code<'70274-6'>; display: string },
  questionnaire: Coding.make({
    system: 'http://loinc.org',
    code: codeLiteral('69737-5'),
    display: 'Generalized anxiety disorder 7 item (GAD-7)',
  }) as Coding & { code: Code<'69737-5'>; display: string },
  feelingNervous: Coding.make({
    system: 'http://loinc.org',
    code: codeLiteral('69725-0'),
    display: 'Feeling nervous, anxious or on edge',
  }) as Coding & { code: Code<'69725-0'>; display: string },
  worryingTooMuch: Coding.make({
    system: 'http://loinc.org',
    code: codeLiteral('69733-4'),
    display: 'Worrying too much about different things',
  }) as Coding & { code: Code<'69733-4'>; display: string },
  troubleRelaxing: Coding.make({
    system: 'http://loinc.org',
    code: codeLiteral('69734-2'),
    display: 'Trouble relaxing',
  }) as Coding & { code: Code<'69734-2'>; display: string },
  restlessHardToSitStill: Coding.make({
    system: 'http://loinc.org',
    code: codeLiteral('69735-9'),
    display: 'Being so restless that it is hard to sit still',
  }) as Coding & { code: Code<'69735-9'>; display: string },
  easilyAnnoyed: Coding.make({
    system: 'http://loinc.org',
    code: codeLiteral('69689-8'),
    display: 'Becoming easily annoyed or irritable.',
  }) as Coding & { code: Code<'69689-8'>; display: string },
  feelingAfraid: Coding.make({
    system: 'http://loinc.org',
    code: codeLiteral('69736-7'),
    display: 'Feeling afraid as if something awful might happen',
  }) as Coding & { code: Code<'69736-7'>; display: string },
  notAtAll: Coding.make({
    system: 'http://loinc.org',
    code: codeLiteral('LA6568-5'),
    display: 'Not at all',
  }) as Coding & { code: Code<'LA6568-5'>; display: string },
  severalDays: Coding.make({
    system: 'http://loinc.org',
    code: codeLiteral('LA6569-3'),
    display: 'Several days',
  }) as Coding & { code: Code<'LA6569-3'>; display: string },
  moreThanHalfTheDays: Coding.make({
    system: 'http://loinc.org',
    code: codeLiteral('LA6570-1'),
    display: 'More than half the days',
  }) as Coding & { code: Code<'LA6570-1'>; display: string },
  nearlyEveryDay: Coding.make({
    system: 'http://loinc.org',
    code: codeLiteral('LA6571-9'),
    display: 'Nearly every day',
  }) as Coding & { code: Code<'LA6571-9'>; display: string },
  notAbleToStopWorrying: Coding.make({
    system: 'http://loinc.org',
    code: codeLiteral('68509-9'),
    display: 'Not able to stop or control worrying in the last 2 weeks',
  }) as Coding & { code: Code<'68509-9'>; display: string },
  unitedStates: Coding.make({
    system: 'urn:iso:std:iso:3166',
    code: codeLiteral('US'),
    display: 'United States of America',
  }) as Coding & { code: Code<'US'>; display: string },
} as const satisfies Record<string, Coding>

export default codings
