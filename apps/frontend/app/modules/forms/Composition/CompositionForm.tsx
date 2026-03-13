import { Patient } from '@assessmentis/clinical-domain'
import { applyPartialProps, transformProps } from '@assessmentis/react-util'

import {
  ResourceForm,
  TextField,
} from 'app/modules/common/components/ResourceForm'
import type { CommonFieldProps } from 'app/modules/common/components/ResourceForm/ResourceForm'

import { ResourcePicker } from '../../ResourcePicker/ResourcePicker'
import { CompositionFormData } from './CompositionFormData'

interface CompositionFormProps {
  onSubmit: (data: CompositionFormData) => void | Promise<void>
  submitLabel: string
  initialValues:
    | typeof CompositionFormData.Encoded
    | Promise<typeof CompositionFormData.Encoded>
}

export function CompositionForm({
  onSubmit,
  submitLabel,
  initialValues,
}: CompositionFormProps) {
  return (
    <ResourceForm
      schema={CompositionFormData}
      fields={{
        title: applyPartialProps(TextField, {
          name: 'title',
          label: 'Title',
          required: true,
        }),
        patientUrl: transformProps(
          ResourcePicker,
          (props: CommonFieldProps<string | undefined>) => ({
            name: 'patientUrl',
            klass: Patient,
            label: 'Subject (Patient)',
            picking: {
              onChange: props.onChange,
              value: props.value,
              multiple: false as const,
            },
          })
        ),
      }}
      fieldOrder={['title', 'patientUrl']}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={initialValues}
    />
  )
}
