import { Schema } from 'effect'
import { DomainResource } from '../../general-purpose/DomainResource'
import { Identifier } from '../../general-purpose/Identifier'
import { Reference } from '../../general-purpose/Reference'
import { CodeableConcept } from '../../general-purpose/CodeableConcept'
import { Annotation } from '../../general-purpose/Annotation'
import { Period } from '../../general-purpose/Period'

export const ObservationId = Schema.String.pipe(Schema.brand('ObservationId'))

export type ObservationId = typeof ObservationId.Type

/**
 * The status of the result value.
 * registered | preliminary | final | amended | corrected | cancelled | entered-in-error | unknown
 */
export const ObservationStatus = Schema.Enums({
  registered: 'registered',
  preliminary: 'preliminary',
  final: 'final',
  amended: 'amended',
  corrected: 'corrected',
  cancelled: 'cancelled',
  'entered-in-error': 'entered-in-error',
  unknown: 'unknown',
} as const)

export type ObservationStatus = typeof ObservationStatus.Type

/**
 * Measurements and simple assertions made about a patient, device or other subject.
 */
export const Observation = Schema.Struct({
  ...DomainResource(ObservationId).fields,
  resourceType: Schema.Literal('Observation'),
  /**
   * A unique identifier assigned to this observation.
   */
  identifier: Schema.optional(Schema.Array(Identifier)),
  /**
   * A plan, proposal or order that is fulfilled in whole or in part by this event. For example, a MedicationRequest may require a patient to have laboratory test performed before it is dispensed.
   */
  basedOn: Schema.optional(Schema.Array(Reference)),
  /**
   * A larger event of which this particular Observation is a component or step. For example, an observation as part of a procedure.
   */
  partOf: Schema.optional(Schema.Array(Reference)),
  /**
   * The status of the result value.
   * This element is labeled as a modifier because the status contains codes that mark the resource as not currently valid.
   */
  status: ObservationStatus,
  /**
   * A code that classifies the general type of observation being made.
   */
  category: Schema.optional(Schema.Array(CodeableConcept)),
  /**
   * Describes what was observed. Sometimes this is called the observation "name".
   */
  code: CodeableConcept,
  /**
   * The patient, or group of patients, location, or device this observation is about and into whose record the observation is placed. If the actual focus of the observation is different from the subject (or a sample of, part, or region of the subject), the focus element or the code itself specifies the actual focus of the observation.
   */
  subject: Schema.optional(Reference),
  /**
   * The actual focus of an observation when it is not the patient of record representing something or someone associated with the patient such as a spouse, parent, fetus, or donor. For example, fetus observations in a mother's record. The focus of an observation could also be an existing condition, an intervention, the subject's diet, another observation of the subject, or a body structure such as tumor or implanted device. An example use case would be using the Observation resource to capture whether the mother is trained to change her child's tracheostomy tube. In this example, the child is the patient of record and the mother is the focus.
   */
  focus: Schema.optional(Schema.Array(Reference)),
  /**
   * The healthcare event (e.g. a patient and healthcare provider interaction) during which this observation is made.
   */
  encounter: Schema.optional(Reference),
  /**
   * The time or time-period the observed value is asserted as being true. For biological subjects - e.g. human patients - this is usually called the "physiologically relevant time". This is usually either the time of the procedure or of specimen collection, but very often the source of the date/time is not known, only the date/time itself.
   * This is a choice element in FHIR (effective[x]) - only one of effectiveDateTime, effectivePeriod, effectiveTiming, or effectiveInstant should be present.
   */
  effectiveDateTime: Schema.optional(Schema.DateTimeUtc),
  effectivePeriod: Schema.optional(Period),
  effectiveTiming: Schema.optional(Schema.Unknown),
  effectiveInstant: Schema.optional(Schema.DateTimeUtc),
  /**
   * The date and time this version of the observation was made available to providers, typically after the results have been reviewed and verified.
   */
  issued: Schema.optional(Schema.DateTimeUtc),
  /**
   * Who was responsible for asserting the observed value as "true".
   */
  performer: Schema.optional(Schema.Array(Reference)),
  /**
   * The information determined as a result of making the observation, if the information has a simple value.
   * This is a choice element in FHIR (value[x]) - can be valueQuantity, valueCodeableConcept, valueString, valueBoolean, valueInteger, valueRange, valueRatio, valueSampledData, valueTime, valueDateTime, or valuePeriod.
   * For simplicity, we're using Schema.Unknown here - in a production system, you'd want to model all value[x] types properly.
   */
  valueQuantity: Schema.optional(Schema.Unknown),
  valueCodeableConcept: Schema.optional(CodeableConcept),
  valueString: Schema.optional(Schema.String),
  valueBoolean: Schema.optional(Schema.Boolean),
  valueInteger: Schema.optional(Schema.Number),
  valueRange: Schema.optional(Schema.Unknown),
  valueRatio: Schema.optional(Schema.Unknown),
  valueSampledData: Schema.optional(Schema.Unknown),
  /**
   * The information determined as a result of making the observation, if the value is a time.
   * Format: HH:MM:SS (e.g., "13:28:17")
   */
  valueTime: Schema.optional(Schema.String),
  valueDateTime: Schema.optional(Schema.DateTimeUtc),
  valuePeriod: Schema.optional(Period),
  /**
   * Provides a reason why the expected value in the element Observation.value[x] is missing.
   */
  dataAbsentReason: Schema.optional(CodeableConcept),
  /**
   * A categorical assessment of an observation value. For example, high, low, normal.
   */
  interpretation: Schema.optional(Schema.Array(CodeableConcept)),
  /**
   * Comments about the observation or the results.
   */
  note: Schema.optional(Schema.Array(Annotation)),
  /**
   * Indicates the site on the subject's body where the observation was made (i.e. the target site).
   */
  bodySite: Schema.optional(CodeableConcept),
  /**
   * Indicates the mechanism used to perform the observation.
   */
  method: Schema.optional(CodeableConcept),
  /**
   * The specimen that was used when this observation was made.
   */
  specimen: Schema.optional(Reference),
  /**
   * The device used to generate the observation data.
   */
  device: Schema.optional(Reference),
  /**
   * Guidance on how to interpret the value by comparison to a normal or recommended range. Multiple reference ranges are interpreted as an "OR". In other words, to represent two distinct target populations, two referenceRange elements would be used.
   */
  referenceRange: Schema.optional(
    Schema.Array(
      Schema.Struct({
        /**
         * The value of the low bound of the reference range. The low bound of the reference range endpoint is inclusive of the value (e.g. reference range is >=5 - <=9). If the low bound is omitted, it is assumed to be meaningless (e.g. reference range is <=2.3).
         */
        low: Schema.optional(Schema.Unknown),
        /**
         * The value of the high bound of the reference range. The high bound of the reference range endpoint is inclusive of the value (e.g. reference range is >=5 - <=9). If the high bound is omitted, it is assumed to be meaningless (e.g. reference range is >= 2.3).
         */
        high: Schema.optional(Schema.Unknown),
        /**
         * Codes to indicate what part of the targeted reference population it applies to. For example, the normal or therapeutic range.
         */
        type: Schema.optional(CodeableConcept),
        /**
         * Codes to indicate the target population this reference range applies to. For example, a reference range may be based on the normal population or a particular sex or race. Multiple appliesTo are interpreted as an "AND" of the target populations. For example, to represent a target population of African American females, both a code of female and a code for African American would be used.
         */
        appliesTo: Schema.optional(Schema.Array(CodeableConcept)),
        /**
         * The age at which this reference range is applicable. This is a neonatal age (e.g. number of weeks at term) if the meaning says so.
         */
        age: Schema.optional(Schema.Unknown),
        /**
         * Text based reference range in an observation which may be used when a quantitative range is not appropriate for an observation. An example would be a reference value of "Negative" or a list or table of "normals".
         */
        text: Schema.optional(Schema.String),
      })
    )
  ),
  /**
   * This observation is a group observation (e.g. a battery, a panel of tests, a set of vital sign measurements) that includes the target as a member of the group.
   */
  hasMember: Schema.optional(Schema.Array(Reference)),
  /**
   * The target resource that represents a measurement from which this observation value is derived. For example, a calculated anion gap or a fetal measurement based on an ultrasound image.
   */
  derivedFrom: Schema.optional(Schema.Array(Reference)),
  /**
   * Some observations have multiple component observations. These component observations are expressed as separate code value pairs that share the same attributes. Examples include systolic and diastolic component observations for blood pressure measurement and multiple component observations for genetics observations.
   */
  component: Schema.optional(
    Schema.Array(
      Schema.Struct({
        /**
         * Describes what was observed. Sometimes this is called the observation "code".
         */
        code: CodeableConcept,
        /**
         * The information determined as a result of making the observation, if the information has a simple value.
         * This is a choice element in FHIR (value[x]) - similar to the main observation value.
         */
        valueQuantity: Schema.optional(Schema.Unknown),
        valueCodeableConcept: Schema.optional(CodeableConcept),
        valueString: Schema.optional(Schema.String),
        valueBoolean: Schema.optional(Schema.Boolean),
        valueInteger: Schema.optional(Schema.Number),
        valueRange: Schema.optional(Schema.Unknown),
        valueRatio: Schema.optional(Schema.Unknown),
        valueSampledData: Schema.optional(Schema.Unknown),
        /**
         * The information determined as a result of making the component observation, if the value is a time.
         * Format: HH:MM:SS (e.g., "13:28:17")
         */
        valueTime: Schema.optional(Schema.String),
        valueDateTime: Schema.optional(Schema.DateTimeUtc),
        valuePeriod: Schema.optional(Period),
        /**
         * Provides a reason why the expected value in the element Observation.component.value[x] is missing.
         */
        dataAbsentReason: Schema.optional(CodeableConcept),
        /**
         * A categorical assessment of an observation value. For example, high, low, normal.
         */
        interpretation: Schema.optional(Schema.Array(CodeableConcept)),
        /**
         * Guidance on how to interpret the value by comparison to a normal or recommended range.
         */
        referenceRange: Schema.optional(
          Schema.Array(
            Schema.Struct({
              low: Schema.optional(Schema.Unknown),
              high: Schema.optional(Schema.Unknown),
              type: Schema.optional(CodeableConcept),
              appliesTo: Schema.optional(Schema.Array(CodeableConcept)),
              age: Schema.optional(Schema.Unknown),
              text: Schema.optional(Schema.String),
            })
          )
        ),
      })
    )
  ),
})

export type Observation = typeof Observation.Type
