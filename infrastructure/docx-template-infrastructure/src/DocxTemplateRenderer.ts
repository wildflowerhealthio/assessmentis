import { Effect } from 'effect'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import {
  TemplateRendererService,
  RenderedDocument,
  DiagnosticReportTemplate,
} from '@assessmentis/clinical-domain/diagnostic-reports'
import {
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer,
} from '@assessmentis/clinical-domain/questionnaires'
import {
  UnhandledError,
  ExternalAssertionError,
} from '@assessmentis/clinical-domain/errors'

/**
 * Implementation of TemplateRendererService using docxtemplater
 */
export class DocxTemplateRenderer extends TemplateRendererService {
  /**
   * Converts a QuestionnaireResponse to a flat key-value object for template rendering
   */
  private extractTemplateData(
    questionnaireResponse: QuestionnaireResponse
  ): Record<string, unknown> {
    const data: Record<string, unknown> = {}

    // Add top-level metadata
    if (questionnaireResponse.id) {
      data.responseId = questionnaireResponse.id
    }
    if (questionnaireResponse.authored) {
      data.authoredDate = questionnaireResponse.authored
    }
    if (questionnaireResponse.questionnaire) {
      data.questionnaireRef = questionnaireResponse.questionnaire
    }
    if (questionnaireResponse.subject?.reference) {
      data.subjectRef = questionnaireResponse.subject.reference
    }

    // Extract answers from items
    if (questionnaireResponse.item) {
      this.extractItemData(questionnaireResponse.item, data)
    }

    return data
  }

  /**
   * Extract value from an answer
   */
  private extractAnswerValue(answer: QuestionnaireResponseItemAnswer): unknown {
    // Type guard checks for each possible value type
    if ('valueString' in answer) {
      return answer.valueString
    } else if ('valueInteger' in answer) {
      return answer.valueInteger
    } else if ('valueDecimal' in answer) {
      return answer.valueDecimal
    } else if ('valueBoolean' in answer) {
      return answer.valueBoolean
    } else if ('valueDate' in answer) {
      return answer.valueDate
    } else if ('valueDateTime' in answer) {
      return answer.valueDateTime
    } else if ('valueTime' in answer) {
      return answer.valueTime
    } else if ('valueCoding' in answer && answer.valueCoding) {
      return answer.valueCoding.display || answer.valueCoding.code
    } else if ('valueUrl' in answer) {
      return answer.valueUrl
    } else if ('valueCode' in answer) {
      return answer.valueCode
    } else if ('valueCanonical' in answer) {
      return answer.valueCanonical
    }
    return null
  }

  /**
   * Recursively extract data from questionnaire response items
   */
  private extractItemData(
    items: ReadonlyArray<QuestionnaireResponseItem>,
    data: Record<string, unknown>,
    prefix: string = ''
  ): void {
    for (const item of items) {
      const key = prefix ? `${prefix}_${item.linkId}` : item.linkId

      // Extract answer values
      if (item.answer && item.answer.length > 0) {
        if (item.answer.length === 1) {
          // Single answer
          const value = this.extractAnswerValue(item.answer[0])
          if (value !== null) {
            data[key] = value
          }
        } else {
          // Multiple answers - create an array
          const values = item.answer
            .map((answer) => this.extractAnswerValue(answer))
            .filter((v) => v !== null)
          if (values.length > 0) {
            data[key] = values
          }
        }
      }

      // Recursively process nested items
      if (item.item) {
        this.extractItemData(item.item, data, key)
      }
    }
  }

  /**
   * Renders a diagnostic report template with data from a questionnaire response
   */
  render(
    template: DiagnosticReportTemplate,
    questionnaireResponse: QuestionnaireResponse
  ): Effect.Effect<RenderedDocument, UnhandledError | ExternalAssertionError> {
    return Effect.gen(this, function* () {
      try {
        // Get template data
        const templateAttachment = template.template
        let templateBuffer: ArrayBuffer

        if (templateAttachment.data) {
          // Template is base64 encoded
          const base64Data = templateAttachment.data
          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          templateBuffer = bytes.buffer
        } else if (templateAttachment.url) {
          // Fetch template from URL
          const response = yield* Effect.tryPromise({
            try: () => fetch(templateAttachment.url!),
            catch: (error) =>
              new ExternalAssertionError({
                cause: error,
                expected: 'Successful fetch of template from URL',
              }),
          })

          if (!response.ok) {
            return yield* Effect.fail(
              new ExternalAssertionError({
                cause: response.statusText,
                expected: 'Successful HTTP response',
              })
            )
          }

          templateBuffer = yield* Effect.tryPromise({
            try: () => response.arrayBuffer(),
            catch: (error) =>
              new ExternalAssertionError({
                cause: error,
                expected: 'Readable template data',
              }),
          })
        } else {
          return yield* Effect.fail(
            new UnhandledError({
              cause: 'Template attachment must have either data or url',
            })
          )
        }

        // Load template with PizZip
        const zip = new PizZip(templateBuffer)

        // Create docxtemplater instance
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        })

        // Extract data from questionnaire response
        const data = this.extractTemplateData(questionnaireResponse)

        // Set the template data
        doc.setData(data)

        // Render the document
        yield* Effect.try({
          try: () => doc.render(),
          catch: (error) =>
            new UnhandledError({
              cause: `Failed to render template: ${error}`,
            }),
        })

        // Generate the output document
        const outputBuffer = doc.getZip().generate({
          type: 'base64',
          mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })

        // Create filename
        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `${template.name || 'report'}_${timestamp}.docx`

        return {
          data: outputBuffer,
          contentType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          filename,
        }
      } catch (error) {
        return yield* Effect.fail(
          new UnhandledError({
            cause: `Unexpected error rendering template: ${error}`,
          })
        )
      }
    })
  }
}
