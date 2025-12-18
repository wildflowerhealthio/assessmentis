import { expect, test, describe } from 'vitest'
import { Attachment } from './Attachment'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { Attachment as FhirAttachment } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _attachmentEncoded: DeepReadonly<FhirAttachment> = Attachment.Encoded

const attachmentArb = Arbitrary.make(Attachment)

describe('Attachment model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(attachmentArb, (attachment) => {
        const encoded = Schema.encodeSync(Attachment)(attachment)
        const decoded = Schema.decodeSync(Attachment)(encoded)
        expect(decoded).toEqual(attachment)
      })
    )
  })
})
