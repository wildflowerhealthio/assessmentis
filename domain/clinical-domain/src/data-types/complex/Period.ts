import { Schema } from 'effect'
import { Element } from '../base/Element'

export const PeriodId = Schema.String.pipe(Schema.brand('PeriodId'))

/**
 * A time period defined by a start and end date/time.
 * A period specifies a range of times. The context of use will specify whether the entire period applies (e.g. "the patient was an inpatient of the hospital for this time range") or one value from the period applies (e.g. "give to the patient between 2 and 4 pm on 24-Jun 2013").
 */
export const Period = Schema.Struct({
  ...Element(PeriodId).fields,
  /**
   * The start of the period. The boundary is inclusive.
   * If the low element is missing, the meaning is that the low boundary is not known.
   */
  start: Schema.optional(Schema.DateTimeUtc),
  /**
   * The end of the period. If the end of the period is missing, it means no end was known or planned at the time the instance was created. The start may be in the past, and the end date in the future, which means that period is expected/planned to end at that time.
   * The high value includes any matching date/time. i.e. 2012-02-03T10:00:00 is in a period that has an end value of 2012-02-03.
   */
  end: Schema.optional(Schema.DateTimeUtc),
})

export type Period = typeof Period.Type
