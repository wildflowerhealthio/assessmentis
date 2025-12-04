import { expect, test } from 'vitest'
import { QuestionnaireResponseItemAnswer } from './QuestionnaireResponseItem.js'
import { DateTime, Either, Schema, Option } from 'effect'

test('QuestionnaireResponseItemAnswer encodes correctly', () => {
  const encode = Schema.encodeEither(QuestionnaireResponseItemAnswer)
  expect(
    encode({
      valueBoolean: true,
      modifierExtension: [
        {
          url: 'some-url',
          valueString: 'a string',
        },
      ],
    })
  ).toStrictEqual(
    Either.right({
      valueBoolean: true,
      modifierExtension: [
        {
          url: 'some-url',
          valueString: 'a string',
        },
      ],
    })
  )

  expect(
    encode({
      valueBoolean: true,
      modifierExtension: [
        {
          url: 'some-url',
          valueDateTime: DateTime.makeZonedFromString(
            '2015-02-07T13:28:17-05:00'
          ).pipe(Option.map(DateTime.toUtc), Option.getOrThrow),
        },
      ],
    })
  ).toStrictEqual(
    Either.right({
      valueBoolean: true,
      modifierExtension: [
        {
          url: 'some-url',
          valueDateTime: '2015-02-07T18:28:17.000Z',
        },
      ],
    })
  )

  expect(
    encode({
      valueBoolean: true,
      modifierExtension: [
        {
          url: 'some-url',
          valueDateTime: DateTime.makeZonedFromString(
            '2015-02-07T13:28:17-05:00[America/Toronto]'
          ).pipe(Option.map(DateTime.toUtc), Option.getOrThrow),
        },
      ],
    })
  ).toStrictEqual(
    Either.right({
      valueBoolean: true,
      modifierExtension: [
        {
          url: 'some-url',
          valueDateTime: '2015-02-07T18:28:17.000Z',
        },
      ],
    })
  )
})

test('decodes', () => {
  const decode = Schema.decodeEither(QuestionnaireResponseItemAnswer)
  expect(
    decode({
      modifierExtension: [
        {
          url: 'http://assessment.is/fhir/questionnaire-item-answered-at',
          valueDateTime: '2025-12-02T16:31:47.575Z',
        },
      ],
      valueBoolean: true,
    })
  ).toStrictEqual(
    Either.right({
      modifierExtension: [
        {
          url: 'http://assessment.is/fhir/questionnaire-item-answered-at',
          valueDateTime: DateTime.make('2025-12-02T16:31:47.575Z').pipe(
            Option.getOrThrow
          ),
        },
      ],
      valueBoolean: true,
    })
  )
})
