import { Schema } from 'effect'

import { BackboneElement, Reference } from '../../data-types'
import type { BackboneElementEncoded } from '../../data-types'

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

/** Decoded link type value for a {@link PatientLink}. */
export type PatientLinkType = typeof PatientLinkType.Type

const fields = {
  other: Schema.suspend(() => Reference),
  type: PatientLinkType,
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of a {@link PatientLink}. */
export interface PatientLinkEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'PatientLink'> {}

/** A link to another Patient resource that concerns the same actual patient. */
export class PatientLink extends BackboneElement(
  'PatientLink'
).extend<PatientLink>('PatientLink')(fields) {}
