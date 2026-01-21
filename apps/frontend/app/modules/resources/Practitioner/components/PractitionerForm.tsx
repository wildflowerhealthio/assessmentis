import { applyPartialProps } from '@assessmentis/react-util'
import {
  ResourceForm,
  SelectField,
  TextField,
} from 'app/modules/common/components/ResourceForm'
import {
  PractitionerFormSchema,
  type PractitionerFormData,
} from '../schemas/PractitionerFormSchema'
import { promiseFieldsFromPromise } from '@assessmentis/util'

interface PractitionerFormProps {
  onSubmit: (data: PractitionerFormData) => void | Promise<void>
  submitLabel: string
  initialValues: Promise<Partial<PractitionerFormData>>
}

export function PractitionerForm({
  onSubmit,
  submitLabel,
  initialValues,
}: PractitionerFormProps) {
  return (
    <ResourceForm
      schema={PractitionerFormSchema}
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
        gender: applyPartialProps(SelectField, {
          name: 'gender',
          label: 'Gender',
          options: [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
            { value: 'unknown', label: 'Unknown' },
          ],
        } as const),
      }}
      fieldOrder={['givenName', 'familyName', 'gender', 'qualification']}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={promiseFieldsFromPromise(initialValues)}
    />
  )
}
