import { Patient } from '@assessmentis/clinical-domain'
import { applyPartialProps, transformProps } from '@assessmentis/react-util'

import { ResourceForm, TextField } from '@/modules/common/components/ResourceForm'
import type { CommonFieldProps } from '@/modules/common/components/ResourceForm/resource-form'

import { ResourcePicker } from '../../ResourcePicker/resource-picker'
import { CompositionFormData } from './composition-form-data'

interface CompositionFormProps {
  onSubmit: (data: CompositionFormData) => void | Promise<void>
  submitLabel: string
  initialValues: typeof CompositionFormData.Encoded | Promise<typeof CompositionFormData.Encoded>
}

export function CompositionForm({
  onSubmit,
  submitLabel,
  initialValues,
}: CompositionFormProps): React.JSX.Element {
  return (
    <ResourceForm
      schema={CompositionFormData}
      fields={{
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
        title: applyPartialProps(TextField, {
          name: 'title',
          label: 'Title',
          required: true,
        }),
      }}
      fieldOrder={['title', 'patientUrl']}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={initialValues}
    />
  )
}
