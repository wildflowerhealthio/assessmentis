import { expect, test, describe, expectTypeOf } from 'vitest'
import { Attachment, type AttachmentEncoded } from './Attachment'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const attachmentArb = Arbitrary.make(Attachment)

describe('Attachment model', () => {
  test('should encode to encoded type', () => {
    expectTypeOf<typeof Attachment.Encoded>().toExtend<AttachmentEncoded>()
  })
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
