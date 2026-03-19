import { Schema } from 'effect'
import { expect } from 'vitest'

import { Meta } from './src/data-types/base/meta'
import { Address } from './src/data-types/complex/address'
import { Annotation } from './src/data-types/complex/annotation'
import { Attachment } from './src/data-types/complex/attachment'
import { CodeableConcept } from './src/data-types/complex/codeable-concept'
import { Coding } from './src/data-types/complex/coding'
import { ContactPoint } from './src/data-types/complex/contact-point'
import { HumanName } from './src/data-types/complex/human-name'
import { Identifier, Reference } from './src/data-types/complex/identifier-and-reference'
import { Period } from './src/data-types/complex/period'
import { Quantity } from './src/data-types/complex/quantity'
import { Range } from './src/data-types/complex/range'
import { SimpleQuantity } from './src/data-types/complex/simple-quantity'
import { Extension } from './src/data-types/special-purpose/extension'
import { Narrative } from './src/data-types/special-purpose/narrative'
import { Composition } from './src/resources/Composition/composition'
import { CompositionAttester } from './src/resources/Composition/composition-attester'
import { CompositionSection } from './src/resources/Composition/composition-section'
import { DiagnosticReport } from './src/resources/DiagnosticReport/diagnostic-report'
import { Encounter } from './src/resources/Encounter/encounter'
import { Location } from './src/resources/Location/location'
import { Media } from './src/resources/Media/media'
import { Observation } from './src/resources/Observation/observation'
import { Patient } from './src/resources/Patient/patient'
import { Practitioner } from './src/resources/Practitioner/practitioner'
import { Questionnaire } from './src/resources/Questionnaire/questionnaire'
import { QuestionnaireResponse } from './src/resources/QuestionnaireResponse/questionnaire-response'
import { QuestionnaireResponseItemAnswer } from './src/resources/QuestionnaireResponse/questionnaire-response-item'

declare global {
  var setupInitialized: boolean | undefined
}

if (!globalThis.setupInitialized) {
  const schemas = {
    Composition,
    DiagnosticReport,
    Encounter,
    Location,
    Media,
    Observation,
    Patient,
    Practitioner,
    Questionnaire,
    QuestionnaireResponse,
    QuestionnaireResponseItemAnswer,
    CompositionAttester,
    CompositionSection,
    Address,
    Annotation,
    Attachment,
    CodeableConcept,
    Coding,
    ContactPoint,
    HumanName,
    Identifier,
    Period,
    Quantity,
    Range,
    Reference,
    SimpleQuantity,
    Extension,
    Meta,
    Narrative,
  } as const

  expect.extend({
    toSchemaEqual(received: unknown, expected: unknown) {
      expect.addEqualityTesters([
        (a: unknown, b: unknown): boolean | undefined => {
          try {
            if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
              if (
                a.constructor === b.constructor &&
                a.constructor.name === b.constructor.name &&
                a.constructor.name in schemas
              ) {
                return Schema.equivalence(
                  // oxlint-disable-next-line typescript/no-explicit-any typescript/no-unsafe-type-assertion
                  schemas[a.constructor.name as keyof typeof schemas] as any
                  // oxlint-disable-next-line typescript/no-explicit-any typescript/no-unsafe-type-assertion
                )(a as any, b as any)
              }
            } else {
              return undefined
            }
          } catch {
            return undefined
          }
        },
      ])
      try {
        expect(received).toEqual(expected)
        return {
          pass: true,
          message: (): string => 'Values are schema-wise equal, as expected.',
          expected,
          actual: received,
        }
      } catch (error) {
        return {
          pass: false,
          message: (): string => {
            let detail: string
            if (error instanceof Error) {
              detail = error.message
            } else {
              detail = String(error)
            }
            return `While Schema-comparing: ${detail}`
          },
          expected,
          actual: received,
        }
      }
    },
  })

  globalThis.setupInitialized = true
}
