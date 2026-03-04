import { applyPartialProps, transformProps } from '@assessmentis/react-util'

import {
  DateTimeField,
  ResourceForm,
} from 'app/modules/common/components/ResourceForm'
import type { CommonFieldProps } from 'app/modules/common/components/ResourceForm/ResourceForm'
import { LocationPicker } from 'app/modules/resources/Location/components/LocationPicker'
import { PatientPicker } from 'app/modules/resources/Patient/components/PatientPicker'
import { PractitionerPicker } from 'app/modules/resources/Practitioner/components/PractitionerPicker'
import { QuestionnairePicker } from 'app/modules/resources/Questionnaire/components/QuestionnairePicker/QuestionnairePicker'

import {
  EncounterFormSchema,
  type EncounterFormData,
} from '../schemas/EncounterFormSchema'

interface EncounterFormProps {
  onSubmit: (data: EncounterFormData) => void | Promise<void>
  submitLabel: string
  initialValues: Promise<Partial<typeof EncounterFormSchema.Encoded>>
}

const encounterFormFields = {
  patientUrl: transformProps(
    PatientPicker,
    (props: CommonFieldProps<string | undefined>) => ({
      name: 'patientUrl',
      label: 'Patient (Subject)',
      picking: {
        onChange: props.onChange,
        value: props.value,
        multiple: false as const,
      },
      placeholder: 'Select the patient for this encounter...',
    })
  ),
  practitionerUrls: transformProps(
    PractitionerPicker,
    (props: CommonFieldProps<ReadonlyArray<string> | undefined>) => ({
      name: 'practitionerUrls',
      label: 'Practitioners (Participants)',
      picking: {
        onChange: props.onChange,
        value: props.value,
        multiple: true as const,
      },
      placeholder: 'Select practitioner(s)...',
    })
  ),
  periodStart: applyPartialProps(DateTimeField, {
    name: 'periodStart',
    label: 'Start Date/Time',
  }),
  periodEnd: applyPartialProps(DateTimeField, {
    name: 'periodEnd',
    label: 'End Date/Time',
  }),
  locationUrl: transformProps(
    LocationPicker,
    (props: CommonFieldProps<string | undefined>) => ({
      name: 'locationUrl',
      label: 'Location',
      picking: {
        onChange: props.onChange,
        value: props.value,
        multiple: false as const,
      },
      placeholder: 'Select a location...',
    })
  ),
  questionnaireUrls: transformProps(
    QuestionnairePicker,
    (props: CommonFieldProps<ReadonlyArray<string>>) => ({
      name: 'questionnaireUrls',
      label: 'Questionnaires',
      picking: {
        onChange: (value: ReadonlyArray<string> | undefined) => {
          if (value) props.onChange(value)
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
}: EncounterFormProps) {
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
