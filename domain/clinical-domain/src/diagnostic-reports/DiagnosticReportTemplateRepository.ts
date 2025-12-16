import { Context } from 'effect'
import { BaseClinicalDataRepository } from '../general-purpose'
import {
  DiagnosticReportTemplate,
  DiagnosticReportTemplateId,
} from './models/DiagnosticReportTemplate'

export class DiagnosticReportTemplateRepository extends Context.Tag(
  'DiagnosticReportTemplateRepository'
)<
  DiagnosticReportTemplateRepository,
  BaseClinicalDataRepository<
    DiagnosticReportTemplate,
    DiagnosticReportTemplateId
  >
>() {}
