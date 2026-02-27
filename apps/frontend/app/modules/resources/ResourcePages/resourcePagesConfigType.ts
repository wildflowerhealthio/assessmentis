import type { ComponentType } from 'react'
import type { Schema } from 'effect'
import type { Effect, Option } from 'effect'
import type {
  ClinicalDataRepositoryErrors,
  RepositoryFilters,
  Schemas,
} from '@assessmentis/clinical-domain'
import type { ReadonlyUrl } from '@assessmentis/effectful-store'
import type { ClinicalDataRepositoryService } from '../../../layers/ClinicalDataRepositoriesService'
import type { NoSelectedOrgError } from '@assessmentis/platform-domain'
import type { NotFoundError } from '@assessmentis/ontology'

type AnyResource = Schema.Schema.Type<(typeof Schemas)[keyof typeof Schemas]>

type WithUrl<T extends { url?: ReadonlyUrl | undefined }> = T & {
  url: NonNullable<T['url']>
}

/**
 * Configuration for the generic resource CRUD pages (create, edit, list).
 *
 * Generic on `TResource` (the FHIR resource type) and `TFormSchema` (the
 * Effect Schema used for the form). Type safety is enforced at the config
 * definition site. The generic page components consume
 * `ResourcePagesConfig<any, any>` to avoid threading generics through routes.
 */
export interface ResourcePagesConfig<
  TResource extends AnyResource,
  TFormSchema extends Schema.Schema.AnyNoContext,
> {
  /** Domain type key — must match a key in ClinicalDataRepositoryService.stream */
  resourceType: TResource['domainType']
  singularLabel: string
  pluralLabel: string
  /** Route param name for the resource ID, e.g. 'patientId' */
  paramName: string

  /** Decode a raw URL param string into a resource URL. Returns None for invalid IDs. */
  decodeUrl: (raw: string) => Option.Option<ReadonlyUrl>
  /** Human-readable display name for a resource instance */
  getDisplayName: (resource: TResource) => string

  schema: TFormSchema
  FormComponent: ComponentType<{
    onSubmit: (data: Schema.Schema.Type<TFormSchema>) => void | Promise<void>
    submitLabel: string
    initialValues: Promise<Schema.Schema.Encoded<TFormSchema>>
  }>

  /** Default form values for the create page (Schema.Encoded shape) */
  defaultFormValues: Schema.Schema.Encoded<TFormSchema>
  /** Extract form initial values from a loaded resource (Schema.Encoded shape) */
  extractFormValues: (resource: TResource) => Schema.Schema.Encoded<TFormSchema>

  createAction: (
    formData: Schema.Schema.Type<TFormSchema>
  ) => Effect.Effect<
    WithUrl<TResource>,
    ClinicalDataRepositoryErrors | NoSelectedOrgError,
    ClinicalDataRepositoryService
  >
  updateAction: (
    url: ReadonlyUrl,
    current: TResource,
    formData: Schema.Schema.Type<TFormSchema>
  ) => Effect.Effect<
    TResource,
    | ClinicalDataRepositoryErrors
    | NoSelectedOrgError
    | NotFoundError<TResource['domainType'], { url: ReadonlyUrl }>,
    ClinicalDataRepositoryService
  >

  /** Summary items shown in the list view (joined with ' • ') */
  getListSummaryItems: (resource: TResource) => string[]

  /**
   * Filters components have internal state, often linked to URL search params.
   * They will just notify upward of changes
   */
  FilterComponent?: ComponentType<{
    onFiltersChange: (params: RepositoryFilters<TResource>) => void
  }>
}
