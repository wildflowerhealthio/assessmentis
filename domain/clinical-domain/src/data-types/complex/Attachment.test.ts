import { expect, test, describe } from 'vitest'
import type { Attachment } from './Attachment'
import { AttachmentFromFhirR4 } from './Attachment'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { Attachment as FhirAttachment } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _attachmentEncoded: DeepReadonly<FhirAttachment> = AttachmentFromFhirR4.Encoded

const attachmentArb = Arbitrary.make(AttachmentFromFhirR4)

describe('Attachment model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(attachmentArb, (attachment) => {
        const encoded = Schema.encodeSync(AttachmentFromFhirR4)(attachment)
        const decoded = Schema.decodeSync(AttachmentFromFhirR4)(encoded)
        expect(decoded).toEqual(attachment)
      })
    )
  })
})
