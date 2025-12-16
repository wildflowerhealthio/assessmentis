import { Effect, Schema, Option } from 'effect'
import { getRuntime, useRuntimeContext } from 'app/clientRuntime'
import type { Route } from './+types/DiagnosticReport.generate.$templateId'
import {
  DiagnosticReportTemplate,
  DiagnosticReportTemplateRepository,
  DiagnosticReportTemplateId,
  TemplateRenderer,
} from '@assessmentis/clinical-domain/diagnostic-reports'
import {
  QuestionnaireResponse,
  QuestionnaireResponseId,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/questionnaires'
import { UnhandledError } from '@assessmentis/clinical-domain/errors'
import { useState } from 'react'

const tryDecodeTemplateId = Schema.decodeOption(DiagnosticReportTemplateId)

export const TemplateWithResponses = Schema.Struct({
  template: DiagnosticReportTemplate,
  questionnaireResponses: Schema.Array(QuestionnaireResponse),
})

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()

  const templateIdStr = params.templateId
  const templateIdMaybe = tryDecodeTemplateId(templateIdStr)

  const dataEffect = Effect.gen(function* () {
    const templateRepository = yield* DiagnosticReportTemplateRepository
    const responseRepository = yield* QuestionnaireResponseRepository

    const templateId = yield* templateIdMaybe.pipe(
      Option.map((id) => Effect.succeed(id)),
      Option.getOrElse(() =>
        Effect.fail(new UnhandledError({ cause: 'Template not found' }))
      )
    )

    const template = yield* templateRepository.get(templateId)

    // Get all questionnaire responses
    // If template has a specific questionnaire reference, filter by that
    const questionnaireResponses = yield* responseRepository.getMany({
      questionnaire: template.questionnaireReference,
    })

    return yield* Schema.encodeUnknown(TemplateWithResponses)({
      template,
      questionnaireResponses,
    })
  })

  return await runtime.runPromise(dataEffect)
}

export default function GenerateReportPage({
  loaderData,
}: Route.ComponentProps) {
  const runtime = useRuntimeContext()
  const { template, questionnaireResponses } = Schema.decodeSync(
    TemplateWithResponses
  )(loaderData)

  const [selectedResponseId, setSelectedResponseId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!selectedResponseId || !runtime) {
      setError('Please select a questionnaire response')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const generateEffect = Effect.gen(function* () {
        const renderer = yield* TemplateRenderer
        const responseRepository = yield* QuestionnaireResponseRepository

        const responseId = QuestionnaireResponseId.make(selectedResponseId)
        const response = yield* responseRepository.get(responseId)
        const rendered = yield* renderer.render(template, response)

        return rendered
      })

      const result = await runtime.runPromise(generateEffect)

      // Create a download link for the generated document
      const blob = new Blob(
        [Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0))],
        { type: result.contentType }
      )
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container" style={{ padding: 'var(--space-4)' }}>
      <h2 className="heading-2">Generate Diagnostic Report</h2>

      <div
        className="card"
        style={{
          padding: 'var(--space-4)',
          marginTop: 'var(--space-4)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-2)',
        }}
      >
        <h3 className="heading-3">Template</h3>
        <p style={{ marginTop: 'var(--space-2)' }}>
          {template.name || 'Untitled Template'}
        </p>
        {template.description && (
          <p
            className="text-muted"
            style={{ marginTop: 'var(--space-2)', fontSize: '0.875rem' }}
          >
            {template.description}
          </p>
        )}
      </div>

      <div
        className="card"
        style={{
          padding: 'var(--space-4)',
          marginTop: 'var(--space-4)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-2)',
        }}
      >
        <h3 className="heading-3">Select Questionnaire Response</h3>
        {questionnaireResponses.length === 0 ? (
          <p className="text-muted" style={{ marginTop: 'var(--space-2)' }}>
            No questionnaire responses available
          </p>
        ) : (
          <select
            className="input"
            style={{
              marginTop: 'var(--space-3)',
              width: '100%',
              padding: 'var(--space-2)',
            }}
            value={selectedResponseId}
            onChange={(e) => setSelectedResponseId(e.target.value)}
          >
            <option value="">-- Select a response --</option>
            {questionnaireResponses.map((response) => (
              <option key={response.id} value={response.id}>
                Response {response.id} - {response.authored || 'No date'}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div
          className="alert alert-error"
          style={{
            padding: 'var(--space-3)',
            marginTop: 'var(--space-4)',
            backgroundColor: 'var(--color-error-bg)',
            color: 'var(--color-error)',
            borderRadius: 'var(--radius-2)',
          }}
        >
          {error}
        </div>
      )}

      <button
        className="button-1 filled"
        style={{
          marginTop: 'var(--space-4)',
          width: '100%',
        }}
        onClick={handleGenerate}
        disabled={isGenerating || !selectedResponseId}
      >
        {isGenerating ? 'Generating...' : 'Generate Report'}
      </button>
    </div>
  )
}
