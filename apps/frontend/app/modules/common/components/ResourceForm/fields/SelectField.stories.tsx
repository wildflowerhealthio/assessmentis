import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { SelectField } from './SelectField'

const meta: Meta<typeof SelectField> = {
  title: 'Components/Form Fields/SelectField',
  component: SelectField,
  parameters: {
    layout: 'centered',
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()

    function onChange(val: string | undefined) {
      updateArgs({ value: val })
    }

    return <SelectField {...args} onChange={onChange} />
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SelectField>

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
]

/**
 * Default select field with no selection
 */
export const Default: Story = {
  args: {
    name: 'gender',
    label: 'Gender',
    value: '',
    options: genderOptions,
  },
}

/**
 * Select field with a pre-selected value
 */
export const WithSelection: Story = {
  args: {
    name: 'gender',
    label: 'Gender',
    value: 'male',
    options: genderOptions,
  },
}

/**
 * Required select field
 */
export const Required: Story = {
  args: {
    name: 'gender',
    label: 'Gender',
    value: '',
    options: genderOptions,
    required: true,
  },
}

/**
 * Select field with error
 */
export const WithError: Story = {
  args: {
    name: 'gender',
    label: 'Gender',
    value: '',
    options: genderOptions,
    error: 'Please select a gender',
  },
}

/**
 * Select field with pre-selected value (female)
 */
export const PreselectedFemale: Story = {
  args: {
    name: 'gender',
    label: 'Gender',
    value: 'female',
    options: genderOptions,
  },
}

/**
 * Select field with many options
 */
export const ManyOptions: Story = {
  args: {
    name: 'country',
    label: 'Country',
    value: '',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'ca', label: 'Canada' },
      { value: 'au', label: 'Australia' },
      { value: 'de', label: 'Germany' },
      { value: 'fr', label: 'France' },
      { value: 'es', label: 'Spain' },
      { value: 'it', label: 'Italy' },
      { value: 'jp', label: 'Japan' },
      { value: 'cn', label: 'China' },
    ],
  },
}
