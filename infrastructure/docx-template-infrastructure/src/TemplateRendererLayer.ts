import { Layer } from 'effect'
import { TemplateRenderer } from '@assessmentis/clinical-domain/diagnostic-reports'
import { DocxTemplateRenderer } from './DocxTemplateRenderer'

export const TemplateRendererLayer = () =>
  Layer.succeed(TemplateRenderer, new DocxTemplateRenderer())
