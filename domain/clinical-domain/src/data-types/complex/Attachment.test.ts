import * as fc from 'fast-check'
import { describe, expect, expectTypeOf, test } from 'vitest'
import { Arbitrary, Schema } from 'effect'

import { Attachment } from './Attachment'
import type { AttachmentEncoded } from './Attachment'

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
