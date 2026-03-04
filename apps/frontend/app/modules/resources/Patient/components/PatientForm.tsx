import { applyPartialProps, transformProps } from '@assessmentis/react-util'
import {
  DateField,
  ResourceForm,
  TextField,
} from 'app/modules/common/components/ResourceForm'
import { PractitionerPicker } from 'app/modules/resources/Practitioner/components/PractitionerPicker'
import { GenderPicker } from 'app/modules/resources/Practitioner/components/GenderPicker'
import type { CommonFieldProps } from 'app/modules/common/components/ResourceForm/ResourceForm'
import {
  PatientFormSchema,
  type PatientFormData,
} from '../schemas/PatientFormSchema'

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => void | Promise<void>
  submitLabel: string
  initialValues: Promise<Partial<typeof PatientFormSchema.Encoded>>
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
        practitionerUrl: transformProps(
          PractitionerPicker,
          (props: CommonFieldProps<string | undefined>) => ({
            name: 'practitionerUrl',
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
        'practitionerUrl',
      ]}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={initialValues}
    />
  )
}
