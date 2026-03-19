import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, expectTypeOf, test } from 'vitest'

import { Attachment } from './attachment'
import type { AttachmentEncoded } from './attachment'

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
        expect(decoded).toSchemaEqual(attachment)
      })
    )
  })
})
