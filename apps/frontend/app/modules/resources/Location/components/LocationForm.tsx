import { applyPartialProps } from '@assessmentis/react-util'
import {
  ResourceForm,
  SelectField,
  TextAreaField,
  TextField,
} from 'app/modules/common/components/ResourceForm'
import type { CommonFieldProps } from 'app/modules/common/components/ResourceForm/ResourceForm'
import type {
  LocationMode,
  LocationStatus,
} from '@assessmentis/clinical-domain/administration'
import {
  LocationFormData,
  LocationFormSchema,
} from '../schemas/LocationFormSchema'

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
] as const

const modeOptions = [
  { value: 'instance', label: 'Instance' },
  { value: 'kind', label: 'Kind' },
] as const

const LocationStatusField: React.FC<
  CommonFieldProps<LocationStatus | undefined>
> = ({ value, onChange, error }) => (
  <SelectField<LocationStatus>
    name="status"
    label="Status"
    options={statusOptions}
    value={value}
    onChange={onChange}
    error={error}
  />
)

const LocationModeField: React.FC<
  CommonFieldProps<LocationMode | undefined>
> = ({ value, onChange, error }) => (
  <SelectField<LocationMode>
    name="mode"
    label="Mode"
    options={modeOptions}
    value={value}
    onChange={onChange}
    error={error}
  />
)

interface LocationFormProps {
  onSubmit: (data: LocationFormData) => void | Promise<void>
  submitLabel: string
  initialValues: Promise<Partial<LocationFormData>>
}

export function LocationForm({
  onSubmit,
  submitLabel,
  initialValues,
}: LocationFormProps) {
  return (
    <ResourceForm
      schema={LocationFormSchema}
      fields={{
        name: applyPartialProps(TextField, {
          name: 'name',
          label: 'Name',
          required: true,
        }),
        description: applyPartialProps(TextAreaField, {
          name: 'description',
          label: 'Description',
        }),
        status: LocationStatusField,
        mode: LocationModeField,
        identifierSystem: applyPartialProps(TextField, {
          name: 'identifierSystem',
          label: 'Identifier System',
        }),
        identifierValue: applyPartialProps(TextField, {
          name: 'identifierValue',
          label: 'Identifier Value',
        }),
      }}
      fieldOrder={[
        'name',
        'description',
        'status',
        'mode',
        'identifierSystem',
        'identifierValue',
      ]}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={initialValues}
    />
  )
}
