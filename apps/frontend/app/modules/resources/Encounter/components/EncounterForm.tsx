import { applyPartialProps, transformProps } from '@assessmentis/react-util'
import {
  ResourceForm,
  DateField,
  TextField,
} from 'app/modules/common/components/ResourceForm'
import { PatientPicker } from 'app/modules/resources/Patient/components/PatientPicker'
import { PractitionerPicker } from 'app/modules/resources/Practitioner/components/PractitionerPicker'
import { QuestionnairePicker } from 'app/modules/resources/Questionnaire/components/QuestionnairePicker/QuestionnairePicker'
import { CommonFieldProps } from 'app/modules/common/components/ResourceForm/ResourceForm'
import {
  EncounterFormSchema,
  type EncounterFormData,
} from '../schemas/EncounterFormSchema'

interface EncounterFormProps {
  onSubmit: (data: EncounterFormData) => void | Promise<void>
  submitLabel: string
  initialValues?: Partial<typeof EncounterFormSchema.Encoded>
}

export function EncounterForm({
  onSubmit,
  submitLabel,
  initialValues,
}: EncounterFormProps) {
  return (
    <ResourceForm
      schema={EncounterFormSchema}
      fields={{
        patientId: transformProps(
          PatientPicker,
          (props: CommonFieldProps<string | undefined>) => ({
            name: 'patientId',
            label: 'Patient (Subject)',
            picking: {
              onChange: props.onChange,
              value: props.value,
              multiple: false as const,
            },
            placeholder: 'Select the patient for this encounter...',
          })
        ),
        practitionerIds: transformProps(
          PractitionerPicker,
          (props: CommonFieldProps<ReadonlyArray<string> | undefined>) => ({
            name: 'practitionerIds',
            label: 'Practitioners (Participants)',
            picking: {
              onChange: props.onChange,
              value: props.value,
              multiple: true as const,
            },
            placeholder: 'Select practitioner(s)...',
          })
        ),
        periodStart: applyPartialProps(DateField, {
          name: 'periodStart',
          label: 'Start Date/Time',
        }),
        periodEnd: applyPartialProps(DateField, {
          name: 'periodEnd',
          label: 'End Date/Time',
        }),
        locationDisplay: applyPartialProps(TextField, {
          name: 'locationDisplay',
          label: 'Location',
          placeholder: 'e.g., Room 101, Virtual Meeting Room',
        }),
        questionnaireIds: transformProps(
          QuestionnairePicker,
          (props: CommonFieldProps<ReadonlyArray<string>>) => ({
            name: 'questionnaireIds',
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
      }}
      fieldOrder={[
        'patientId',
        'practitionerIds',
        'periodStart',
        'periodEnd',
        'locationDisplay',
        'questionnaireIds',
      ]}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={initialValues}
    />
  )
}
