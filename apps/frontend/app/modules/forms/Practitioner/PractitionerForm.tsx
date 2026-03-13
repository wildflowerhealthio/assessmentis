import { applyPartialProps } from '@assessmentis/react-util'

import {
  ResourceForm,
  TextField,
} from 'app/modules/common/components/ResourceForm'

import { GenderPicker } from './GenderPicker'
import { PractitionerFormData } from './PractitionerFormData'

interface PractitionerFormProps {
  onSubmit: (data: PractitionerFormData) => void | Promise<void>
  submitLabel: string
  initialValues:
    | Partial<PractitionerFormData>
    | Promise<Partial<PractitionerFormData>>
}

export function PractitionerForm({
  onSubmit,
  submitLabel,
  initialValues,
}: PractitionerFormProps) {
  return (
    <ResourceForm
      schema={PractitionerFormData}
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
        qualification: applyPartialProps(TextField, {
          name: 'qualification',
          label: 'Qualification',
        }),
        gender: applyPartialProps(GenderPicker, {
          name: 'gender',
          label: 'Gender',
        }),
      }}
      fieldOrder={['givenName', 'familyName', 'gender', 'qualification']}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={initialValues}
    />
  )
}
