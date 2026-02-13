import { Schema } from 'effect'
import { Code } from '../complex/Coding'
import { Meta } from './DomainResource'
import type { Resource as FhirResource } from 'fhir/r4'
import type { DeepReadonly } from '@assessmentis/util'

export interface Resource<IdType extends string> {
  /**
   * Logical id of this artifact
   */
  readonly id?: IdType | undefined
  readonly resourceType: string
  readonly meta?: Meta
  readonly implicitRules?: URL
  readonly language?: Code
}

export const ResourceFromFhirR4 = <IdType extends string>(
  idSchema: Schema.Schema<IdType, string>
): Schema.Schema<Resource<IdType>, DeepReadonly<FhirResource>, never> =>
  Schema.Struct({
    /**
     * Logical id of this artifact
     */
    id: Schema.optional(idSchema),

    resourceType: Schema.String,

    /**
     * Metadata about the resource
     */
    meta: Schema.optional(Meta),
    /**
     * A set of rules under which this content was created
     */
    implicitRules: Schema.optional(Schema.URL),
    /**
     * Language of the resource content
     */
    language: Schema.optional(Code),
  })
