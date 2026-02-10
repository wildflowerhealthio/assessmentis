import { applyPartialProps, transformProps } from '@assessmentis/react-util'
import {
  DateField,
  ResourceForm,
  TextField,
} from 'app/modules/common/components/ResourceForm'
import { PractitionerPicker } from 'app/modules/resources/Practitioner/components/PractitionerPicker'
import { GenderPicker } from 'app/modules/resources/Practitioner/components/GenderPicker'
import { CommonFieldProps } from 'app/modules/common/components/ResourceForm/ResourceForm'
import {
  PatientFormSchema,
  type PatientFormData,
} from '../schemas/PatientFormSchema'

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => void | Promise<void>
  submitLabel: string
  initialValues: Promise<Partial<PatientFormData>>
}

export function PatientForm({
  onSubmit,
  submitLabel,
  initialValues,
}: PatientFormProps) {
  return (
    <ResourceForm
      schema={PatientFormSchema}
      fields={{
        givenName: applyPartialProps(TextField, {
          name: 'givenName',
          label: 'Given Name',
          required: true,
        }),
        familyName: applyPartialProps(TextField, {
          name: 'familyName',
          label: 'Family Name',
          required: true,
        }),
        gender: applyPartialProps(GenderPicker, {
          name: 'gender',
          label: 'Gender',
        }),
        birthDate: applyPartialProps(DateField, {
          name: 'birthDate',
          label: 'Birth Date',
        }),
        practitionerId: transformProps(
          PractitionerPicker,
          (props: CommonFieldProps<string | undefined>) => ({
            name: 'practitionerId',
            label: 'General Practitioner',
            picking: {
              onChange: props.onChange,
              value: props.value,
              multiple: false as const,
            },
          })
        ),
      }}
      fieldOrder={[
        'givenName',
        'familyName',
        'gender',
        'birthDate',
        'practitionerId',
      ]}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={initialValues}
    />
  )
}
