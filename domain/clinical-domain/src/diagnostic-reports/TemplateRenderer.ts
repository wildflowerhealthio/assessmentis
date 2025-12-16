import { Context, Effect } from 'effect'
import { QuestionnaireResponse } from '../questionnaires/models/QuestionnaireResponse'
import { DiagnosticReportTemplate } from './models/DiagnosticReportTemplate'
import { ClinicalDataRepositoryErrors } from '../general-purpose'

/**
 * Result of rendering a template
 */
export interface RenderedDocument {
  /**
   * The rendered document as a base64-encoded string
   */
  readonly data: string
  /**
   * MIME type of the rendered document (e.g., "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
   */
  readonly contentType: string
  /**
   * Suggested filename for the rendered document
   */
  readonly filename: string
}

/**
 * Service for rendering diagnostic report templates with questionnaire response data
 */
export abstract class TemplateRendererService {
  /**
   * Renders a diagnostic report template with data from a questionnaire response
   * @param template The template to render
   * @param questionnaireResponse The questionnaire response containing the data
   * @returns The rendered document
   */
  abstract render(
    template: DiagnosticReportTemplate,
    questionnaireResponse: QuestionnaireResponse
  ): Effect.Effect<RenderedDocument, ClinicalDataRepositoryErrors, never>
}

export class TemplateRenderer extends Context.Tag('TemplateRenderer')<
  TemplateRenderer,
  TemplateRendererService
>() {}
