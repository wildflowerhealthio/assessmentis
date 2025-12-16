import { Effect, Schema } from 'effect'
import { getRuntime } from 'app/clientRuntime'
import type { Route } from './+types/DiagnosticReport._index'
import DiagnosticReportTemplatesList from './DiagnosticReport/DiagnosticReportTemplatesList'
import {
  DiagnosticReportTemplate,
  DiagnosticReportTemplateRepository,
} from '@assessmentis/clinical-domain/diagnostic-reports'
import { useNavigate } from 'react-router'

export async function clientLoader() {
  const runtime = await getRuntime()

  const templatesEffect = Effect.gen(function* () {
    const templateRepository = yield* DiagnosticReportTemplateRepository
    const templates = yield* templateRepository.getMany()
    return yield* Schema.encodeUnknown(Schema.Array(DiagnosticReportTemplate))(
      templates
    )
  })

  return await runtime.runPromise(templatesEffect)
}

export default function DiagnosticReportTemplatesPage({
  loaderData,
}: Route.ComponentProps) {
  const navigate = useNavigate()
  const templates = Schema.decodeSync(Schema.Array(DiagnosticReportTemplate))(
    loaderData
  )

  const handleSelectTemplate = (template: DiagnosticReportTemplate) => {
    // Navigate to the generate report page with this template
    navigate(`/DiagnosticReport/generate/${template.id}`)
  }

  return (
    <DiagnosticReportTemplatesList
      templates={[...templates]}
      onSelectTemplate={handleSelectTemplate}
    />
  )
}
