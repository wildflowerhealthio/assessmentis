import type { LocationMode, LocationStatus } from '@assessmentis/clinical-domain'
import { applyPartialProps } from '@assessmentis/react-util'

import {
  ResourceForm,
  SelectField,
  TextAreaField,
  TextField,
} from '@/modules/common/components/ResourceForm'
import type { CommonFieldProps } from '@/modules/common/components/ResourceForm/resource-form'

import { LocationFormData } from './location-form-data'

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Inactive', value: 'inactive' },
] as const

const modeOptions = [
  { label: 'Instance', value: 'instance' },
  { label: 'Kind', value: 'kind' },
] as const

const LocationStatusField: React.FC<CommonFieldProps<LocationStatus | undefined>> = ({
  value,
  onChange,
  error,
}) => (
  <SelectField<LocationStatus>
    name="status"
    label="Status"
    options={statusOptions}
    value={value}
    onChange={onChange}
    error={error}
  />
)

const LocationModeField: React.FC<CommonFieldProps<LocationMode | undefined>> = ({
  value,
  onChange,
  error,
}) => (
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
  initialValues: Partial<LocationFormData> | Promise<Partial<LocationFormData>>
}

export function LocationForm({
  onSubmit,
  submitLabel,
  initialValues,
}: LocationFormProps): React.JSX.Element {
  return (
    <ResourceForm
      schema={LocationFormData}
      fields={{
        description: applyPartialProps(TextAreaField, {
          name: 'description',
          label: 'Description',
        }),
        identifierSystem: applyPartialProps(TextField, {
          name: 'identifierSystem',
          label: 'Identifier System',
        }),
        identifierValue: applyPartialProps(TextField, {
          name: 'identifierValue',
          label: 'Identifier Value',
        }),
        mode: LocationModeField,
        name: applyPartialProps(TextField, {
          name: 'name',
          label: 'Name',
          required: true,
        }),
        status: LocationStatusField,
      }}
      fieldOrder={['name', 'description', 'status', 'mode', 'identifierSystem', 'identifierValue']}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={initialValues}
    />
  )
}
