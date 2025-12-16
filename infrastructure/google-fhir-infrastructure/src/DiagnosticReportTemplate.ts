import { Effect, Layer } from 'effect'
import {
  DiagnosticReportTemplate,
  DiagnosticReportTemplateId,
  DiagnosticReportTemplateRepository,
} from '@assessmentis/clinical-domain/diagnostic-reports'
import { WithId } from '@assessmentis/clinical-domain/general-purpose'
import {
  UnhandledError,
} from '@assessmentis/clinical-domain/errors'
import {
  BaseClinicalDataRepository,
  ClinicalDataRepositoryErrors,
  ClinicalDataRepositoryErrorsWithNotFound,
} from '@assessmentis/clinical-domain/general-purpose'

/**
 * Google FHIR Store implementation of DiagnosticReportTemplateRepository.
 * Note: Since DiagnosticReportTemplate is not a standard FHIR resource,
 * this is currently a stub implementation that returns empty results.
 * In a production system, templates would be stored in a separate storage system
 * (e.g., Cloud Storage, Firestore) or as custom FHIR resources with extensions.
 */
class GoogleFhirDiagnosticReportTemplateRepository
  implements
    BaseClinicalDataRepository<
      DiagnosticReportTemplate,
      DiagnosticReportTemplateId
    >
{

  get(
    _id: DiagnosticReportTemplateId
  ): Effect.Effect<
    WithId<DiagnosticReportTemplate>,
    ClinicalDataRepositoryErrorsWithNotFound,
    never
  > {
    return Effect.fail(
      new UnhandledError({
        cause: 'DiagnosticReportTemplate storage not yet implemented in FHIR store',
      })
    )
  }

  getMany(): Effect.Effect<
    WithId<DiagnosticReportTemplate>[],
    ClinicalDataRepositoryErrors,
    never
  > {
    // Return empty array for now - templates should be managed separately
    return Effect.succeed([])
  }

  create(
    _resource: DiagnosticReportTemplate
  ): Effect.Effect<
    WithId<DiagnosticReportTemplate>,
    ClinicalDataRepositoryErrors,
    never
  > {
    return Effect.fail(
      new UnhandledError({
        cause: 'DiagnosticReportTemplate creation not yet implemented in FHIR store',
      })
    )
  }

  createMany(
    _resources: ReadonlyArray<DiagnosticReportTemplate>
  ): Effect.Effect<
    ReadonlyArray<WithId<DiagnosticReportTemplate>>,
    ClinicalDataRepositoryErrors,
    never
  > {
    return Effect.fail(
      new UnhandledError({
        cause: 'DiagnosticReportTemplate bulk creation not yet implemented in FHIR store',
      })
    )
  }

  update(
    _resource: WithId<DiagnosticReportTemplate>
  ): Effect.Effect<
    WithId<DiagnosticReportTemplate>,
    ClinicalDataRepositoryErrorsWithNotFound,
    never
  > {
    return Effect.fail(
      new UnhandledError({
        cause: 'DiagnosticReportTemplate update not yet implemented in FHIR store',
      })
    )
  }

  delete(
    _id: DiagnosticReportTemplateId
  ): Effect.Effect<object, ClinicalDataRepositoryErrorsWithNotFound, never> {
    return Effect.fail(
      new UnhandledError({
        cause: 'DiagnosticReportTemplate deletion not yet implemented in FHIR store',
      })
    )
  }
}

export const Repository = () =>
  Layer.succeed(
    DiagnosticReportTemplateRepository,
    new GoogleFhirDiagnosticReportTemplateRepository()
  )
