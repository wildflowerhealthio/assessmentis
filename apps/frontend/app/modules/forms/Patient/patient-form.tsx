import { Practitioner } from '@assessmentis/clinical-domain'
import { applyPartialProps, transformProps } from '@assessmentis/react-util'

import { DateField, ResourceForm, TextField } from '@/modules/common/components/ResourceForm'
import type { CommonFieldProps } from '@/modules/common/components/ResourceForm/resource-form'
import { GenderPicker } from '@/modules/forms/Practitioner/gender-picker'

import { ResourcePicker } from '../../ResourcePicker/resource-picker'
import { PatientFormData } from './patient-form-data'

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => void | Promise<void>
  submitLabel: string
  initialValues:
    | Partial<typeof PatientFormData.Encoded>
    | Promise<Partial<typeof PatientFormData.Encoded>>
}

export function PatientForm({
  onSubmit,
  submitLabel,
  initialValues,
}: PatientFormProps): React.JSX.Element {
  return (
    <ResourceForm
      schema={PatientFormData}
      fields={{
        birthDate: applyPartialProps(DateField, {
          name: 'birthDate',
          label: 'Birth Date',
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
        givenName: applyPartialProps(TextField, {
          name: 'givenName',
          label: 'Given Name',
          required: true,
        }),
        practitionerUrl: transformProps(
          ResourcePicker,
          (props: CommonFieldProps<string | undefined>) => ({
            name: 'practitionerUrl',
            klass: Practitioner,
            label: 'General Practitioner',
            picking: {
              onChange: props.onChange,
              value: props.value,
              multiple: false as const,
            },
          })
        ),
      }}
      fieldOrder={['givenName', 'familyName', 'gender', 'birthDate', 'practitionerUrl']}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={initialValues}
    />
  )
}
