import { expect, test, describe } from 'vitest'
import { Attachment } from './Attachment'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const attachmentArb = Arbitrary.make(Attachment.Schema)

describe('Attachment model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(attachmentArb, (attachment) => {
        const encoded = Schema.encodeSync(Attachment.Schema)(attachment)
        const decoded = Schema.decodeSync(Attachment.Schema)(encoded)
        expect(decoded).toEqual(attachment)
      })
    )
  })
})
