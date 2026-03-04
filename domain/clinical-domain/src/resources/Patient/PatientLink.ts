import { Schema } from 'effect'
import {
  Reference,
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types'

/**
 * This element is labeled as a modifier because it may be used to mark that the
 * resource was created in error.
 */
export const PatientLinkType = Schema.Enums({
  'replaced-by': 'replaced-by',
  replaces: 'replaces',
  refer: 'refer',
  seealso: 'seealso',
} as const)

export type PatientLinkType = typeof PatientLinkType.Type

const fields = {
  other: Schema.suspend(() => Reference),
  type: PatientLinkType,
} as const satisfies Schema.Struct.Fields

export interface PatientLinkEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'PatientLink'> {}

export class PatientLink extends BackboneElement(
  'PatientLink'
).extend<PatientLink>('PatientLink')(fields) {}
