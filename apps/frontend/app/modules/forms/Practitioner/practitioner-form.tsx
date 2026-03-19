import { applyPartialProps } from '@assessmentis/react-util'

import { ResourceForm, TextField } from '@/modules/common/components/ResourceForm'

import { GenderPicker } from './gender-picker'
import { PractitionerFormData } from './practitioner-form-data'

interface PractitionerFormProps {
  onSubmit: (data: PractitionerFormData) => void | Promise<void>
  submitLabel: string
  initialValues: Partial<PractitionerFormData> | Promise<Partial<PractitionerFormData>>
}

export function PractitionerForm({
  onSubmit,
  submitLabel,
  initialValues,
}: PractitionerFormProps): React.JSX.Element {
  return (
    <ResourceForm
      schema={PractitionerFormData}
      fields={{
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
        qualification: applyPartialProps(TextField, {
          name: 'qualification',
          label: 'Qualification',
        }),
      }}
      fieldOrder={['givenName', 'familyName', 'gender', 'qualification']}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={initialValues}
    />
  )
}
