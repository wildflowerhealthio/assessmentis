import { Schema } from 'effect'
import * as Period from './Period'

export const Key = 'HumanName'
export type Key = typeof Key

export interface Type {
  /**
   * Identifies the purpose for this name.
   * usual | official | temp | nickname | anonymous | old | maiden
   */
  use?:
    | 'usual'
    | 'official'
    | 'temp'
    | 'nickname'
    | 'anonymous'
    | 'old'
    | 'maiden'
  /**
   * Specifies the entire name as it should be displayed e.g. on an application UI. This may be provided instead of or as well as the specific parts.
   */
  text?: string
  /**
   * The part of a name that links to the genealogy. In some cultures (e.g. Eritrea) the family name of a son is the first name of his father.
   */
  family?: string
  /**
   * Given name.
   */
  given?: string[]
  /**
   * Part of the name that is acquired as a title due to academic, legal, employment or nobility status, etc. and that appears at the start of the name.
   */
  prefix?: string[]
  /**
   * Part of the name that is acquired as a title due to academic, legal, employment or nobility status, etc. and that appears at the end of the name.
   */
  suffix?: string[]
  /**
   * Indicates the period of time when this name was valid for the named person.
   */
  period?: Period.Period
}

/**
 * A human's name with the ability to identify parts and usage.
 */
export class HumanName extends Schema.Class<HumanName>(Key)({
  /**
   * Identifies the purpose for this name.
   * usual | official | temp | nickname | anonymous | old | maiden
   */
  use: Schema.optional(
    Schema.Union(
      Schema.Literal('usual'),
      Schema.Literal('official'),
      Schema.Literal('temp'),
      Schema.Literal('nickname'),
      Schema.Literal('anonymous'),
      Schema.Literal('old'),
      Schema.Literal('maiden')
    )
  ),
  /**
   * Specifies the entire name as it should be displayed e.g. on an application UI. This may be provided instead of or as well as the specific parts.
   */
  text: Schema.optional(Schema.String),
  /**
   * The part of a name that links to the genealogy. In some cultures (e.g. Eritrea) the family name of a son is the first name of his father.
   */
  family: Schema.optional(Schema.String),
  /**
   * Given name.
   */
  given: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
  /**
   * Part of the name that is acquired as a title due to academic, legal, employment or nobility status, etc. and that appears at the start of the name.
   */
  prefix: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
  /**
   * Part of the name that is acquired as a title due to academic, legal, employment or nobility status, etc. and that appears at the end of the name.
   */
  suffix: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
  /**
   * Indicates the period of time when this name was valid for the named person.
   */
  period: Schema.optional(Schema.suspend(() => Period.Period)),
}) {}
