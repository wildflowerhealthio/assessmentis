import { applyPartialProps, transformProps } from '@assessmentis/react-util'
import {
  ResourceForm,
  DateTimeField,
  TextField,
} from 'app/modules/common/components/ResourceForm'
import { ValueTypePicker } from './ValueTypePicker'
import { PatientPicker } from 'app/modules/resources/Patient/components/PatientPicker'
import { EncounterPicker } from 'app/modules/resources/Encounter/components/EncounterPicker'
import type { CommonFieldProps } from 'app/modules/common/components/ResourceForm/ResourceForm'
import {
  ObservationFormSchema,
  type ObservationFormData,
} from '../schemas/ObservationFormSchema'

interface ObservationFormProps {
  onSubmit: (data: ObservationFormData) => void | Promise<void>
  submitLabel: string
  initialValues: Promise<Partial<typeof ObservationFormSchema.Encoded>>
}

export function ObservationForm({
  onSubmit,
  submitLabel,
  initialValues,
}: ObservationFormProps) {
  return (
    <ResourceForm
      schema={ObservationFormSchema}
      fields={{
        patientUrl: transformProps(
          PatientPicker,
          (props: CommonFieldProps<string | undefined>) => ({
            name: 'patientUrl',
            label: 'Subject (Patient)',
            picking: {
              onChange: props.onChange,
              value: props.value,
              multiple: false as const,
            },
          })
        ),
        encounterUrl: transformProps(
          EncounterPicker,
          (props: CommonFieldProps<string | undefined>) => ({
            name: 'encounterUrl',
            label: 'Encounter',
            picking: {
              onChange: props.onChange,
              value: props.value,
              multiple: false as const,
            },
          })
        ),
        code: applyPartialProps(TextField, {
          name: 'code',
          label: 'Observation Code',
          placeholder: 'e.g., Blood Pressure, Heart Rate, Temperature',
          required: true,
        }),
        valueType: applyPartialProps(ValueTypePicker, {
          name: 'valueType',
          label: 'Value Type',
          required: true,
        }),
        valueString: applyPartialProps(TextField, {
          name: 'valueString',
          label: 'Value (Text)',
          placeholder: 'e.g., Normal, Abnormal, Positive',
          helpText: 'Used when Value Type is "Text (String)"',
        }),
        valueQuantityValue: applyPartialProps(TextField, {
          name: 'valueQuantityValue',
          label: 'Quantity Value',
          placeholder: 'e.g., 120',
          type: 'number',
          helpText: 'Used when Value Type is "Quantity (with Unit)"',
        }),
        valueQuantityUnit: applyPartialProps(TextField, {
          name: 'valueQuantityUnit',
          label: 'Quantity Unit',
          placeholder: 'e.g., mmHg, bpm, °F, mg/dL',
          helpText: 'Used when Value Type is "Quantity (with Unit)"',
        }),
        valueCodeableConceptText: applyPartialProps(TextField, {
          name: 'valueCodeableConceptText',
          label: 'Concept Text',
          placeholder: 'e.g., Hypertension, Normal Range',
          helpText: 'Used when Value Type is "Coded Concept"',
        }),
        valueCodeableConceptCodingCode: applyPartialProps(TextField, {
          name: 'valueCodeableConceptCodingCode',
          label: 'Coding Code',
          placeholder: 'e.g., 38341003, I10',
          helpText:
            'Used when Value Type is "Coded Concept" - the actual code value',
        }),
        valueCodeableConceptCodingSystem: applyPartialProps(TextField, {
          name: 'valueCodeableConceptCodingSystem',
          label: 'Coding System',
          placeholder:
            'e.g., http://snomed.info/sct, http://hl7.org/fhir/sid/icd-10',
          helpText:
            'Used when Value Type is "Coded Concept" - the coding system URI',
        }),
        valueCodeableConceptCodingDisplay: applyPartialProps(TextField, {
          name: 'valueCodeableConceptCodingDisplay',
          label: 'Coding Display',
          placeholder: 'e.g., Essential hypertension',
          helpText:
            'Used when Value Type is "Coded Concept" - human-readable code description',
        }),
        effectiveDateTime: applyPartialProps(DateTimeField, {
          name: 'effectiveDateTime',
          label: 'Effective Date/Time',
        }),
      }}
      fieldOrder={[
        'patientUrl',
        'encounterUrl',
        'code',
        'valueType',
        'valueString',
        'valueQuantityValue',
        'valueQuantityUnit',
        'valueCodeableConceptText',
        'valueCodeableConceptCodingCode',
        'valueCodeableConceptCodingSystem',
        'valueCodeableConceptCodingDisplay',
        'effectiveDateTime',
      ]}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      initialValues={initialValues}
    />
  )
}
