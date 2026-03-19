import { Location, Patient, Practitioner, Questionnaire } from '@assessmentis/clinical-domain'
import { applyPartialProps, transformProps } from '@assessmentis/react-util'

import { DateTimeField, ResourceForm } from '@/modules/common/components/ResourceForm'
import type { CommonFieldProps } from '@/modules/common/components/ResourceForm/resource-form'

import { ResourcePicker } from '../../../ResourcePicker/resource-picker'
import { EncounterFormSchema } from '../schemas/encounter-form-schema'
import type { EncounterFormData } from '../schemas/encounter-form-schema'

interface EncounterFormProps {
  onSubmit: (data: EncounterFormData) => void | Promise<void>
  submitLabel: string
  initialValues: Promise<Partial<typeof EncounterFormSchema.Encoded>>
}

const encounterFormFields = {
  locationUrl: transformProps(ResourcePicker, (props: CommonFieldProps<string | undefined>) => ({
    name: 'locationUrl',
    klass: Location,
    picking: {
      onChange: props.onChange,
      value: props.value,
      multiple: false as const,
    },
  })),
  patientUrl: transformProps(ResourcePicker, (props: CommonFieldProps<string | undefined>) => ({
    name: 'patientUrl',
    klass: Patient,
    label: 'Patient (Subject)',
    picking: {
      onChange: props.onChange,
      value: props.value,
      multiple: false as const,
    },
    placeholder: 'Select the patient for this encounter...',
  })),
  periodEnd: applyPartialProps(DateTimeField, {
    name: 'periodEnd',
    label: 'End Date/Time',
  }),
  periodStart: applyPartialProps(DateTimeField, {
    name: 'periodStart',
    label: 'Start Date/Time',
  }),
  practitionerUrls: transformProps(
    ResourcePicker,
    (props: CommonFieldProps<ReadonlyArray<string> | undefined>) => ({
      name: 'practitionerUrls',
      klass: Practitioner,
      label: 'Practitioners (Participants)',
      picking: {
        onChange: props.onChange,
        value: props.value,
        multiple: true as const,
      },
      placeholder: 'Select practitioner(s)...',
    })
  ),
  questionnaireUrls: transformProps(
    ResourcePicker,
    (props: CommonFieldProps<ReadonlyArray<string>>) => ({
      name: 'questionnaireUrls',
      klass: Questionnaire,
      label: 'Questionnaires',
      picking: {
        onChange: (value: ReadonlyArray<string> | undefined): void => {
          if (value) {
            props.onChange(value)
          }
        },
        value: props.value,
        multiple: true as const,
      },
      placeholder: 'Select questionnaire(s)...',
      immediate: true,
      required: true,
    })
  ),
} as const

const fieldOrder = [
  'patientUrl',
  'practitionerUrls',
  'periodStart',
  'periodEnd',
  'locationUrl',
  'questionnaireUrls',
] as const

export function EncounterForm({
  onSubmit,
  submitLabel,
  initialValues,
}: EncounterFormProps): React.JSX.Element {
  return (
    <ResourceForm
      schema={EncounterFormSchema}
      fields={encounterFormFields}
      fieldOrder={fieldOrder}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={initialValues}
    />
  )
}
