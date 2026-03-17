import { Practitioner } from '@assessmentis/clinical-domain'
import { applyPartialProps, transformProps } from '@assessmentis/react-util'

import {
  DateField,
  ResourceForm,
  TextField,
} from 'app/modules/common/components/ResourceForm'
import type { CommonFieldProps } from 'app/modules/common/components/ResourceForm/ResourceForm'
import { GenderPicker } from 'app/modules/forms/Practitioner/GenderPicker'

import { ResourcePicker } from '../../ResourcePicker/ResourcePicker'
import { PatientFormData } from './PatientFormData'

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
}: PatientFormProps) {
  return (
    <ResourceForm
      schema={PatientFormData}
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
