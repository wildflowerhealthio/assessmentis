import { applyPartialProps, transformProps } from '@assessmentis/react-util'
import {
  ResourceForm,
  TextField,
} from 'app/modules/common/components/ResourceForm'
import { PatientPicker } from 'app/modules/resources/Patient/components/PatientPicker'
import type { CommonFieldProps } from 'app/modules/common/components/ResourceForm/ResourceForm'
import {
  CompositionFormSchema,
  type CompositionFormData,
} from '../schemas/CompositionFormSchema'

interface CompositionFormProps {
  onSubmit: (data: CompositionFormData) => void | Promise<void>
  submitLabel: string
  initialValues: Promise<typeof CompositionFormSchema.Encoded>
}

export function CompositionForm({
  onSubmit,
  submitLabel,
  initialValues,
}: CompositionFormProps) {
  return (
    <ResourceForm
      schema={CompositionFormSchema}
      fields={{
        title: applyPartialProps(TextField, {
          name: 'title',
          label: 'Title',
          required: true,
        }),
        patientId: transformProps(
          PatientPicker,
          (props: CommonFieldProps<string | undefined>) => ({
            name: 'patientId',
            label: 'Subject (Patient)',
            picking: {
              onChange: props.onChange,
              value: props.value,
              multiple: false as const,
            },
          })
        ),
      }}
      fieldOrder={['title', 'patientId']}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={initialValues}
    />
  )
}
