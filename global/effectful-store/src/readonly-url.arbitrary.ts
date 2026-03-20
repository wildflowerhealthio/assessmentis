import { Arbitrary } from 'effect'

import { ReadonlyUrl } from './readonly-url'

/** Arbitrary for ReadonlyUrl base schema (pre-encode). */
const readonlyUrlArb = Arbitrary.make(ReadonlyUrl)

/** Arbitrary for ReadonlyUrl.FromString (well-formed URL strings → ReadonlyUrl). */
const wellFormedUrlArb = Arbitrary.make(ReadonlyUrl.FromString)

export { readonlyUrlArb, wellFormedUrlArb }
