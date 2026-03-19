import type { Meta, StoryObj } from '@storybook/react-vite'

import { useArgs } from 'storybook/preview-api'

import { SelectField } from './select-field'

const meta: Meta<typeof SelectField> = {
  component: SelectField,
  parameters: {
    layout: 'centered',
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()

    function onChange(val: string | undefined): void {
      updateArgs({ value: val })
    }

    return <SelectField {...args} onChange={onChange} />
  },
  tags: ['autodocs'],
  title: 'Components/Form Fields/SelectField',
}

export default meta
type Story = StoryObj<typeof SelectField>

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Unknown', value: 'unknown' },
]

/**
 * Default select field with no selection
 */
export const Default: Story = {
  args: {
    label: 'Gender',
    name: 'gender',
    options: genderOptions,
    value: '',
  },
}

/**
 * Select field with a pre-selected value
 */
export const WithSelection: Story = {
  args: {
    label: 'Gender',
    name: 'gender',
    options: genderOptions,
    value: 'male',
  },
}

/**
 * Required select field
 */
export const Required: Story = {
  args: {
    label: 'Gender',
    name: 'gender',
    options: genderOptions,
    required: true,
    value: '',
  },
}

/**
 * Select field with error
 */
export const WithError: Story = {
  args: {
    error: 'Please select a gender',
    label: 'Gender',
    name: 'gender',
    options: genderOptions,
    value: '',
  },
}

/**
 * Select field with pre-selected value (female)
 */
export const PreselectedFemale: Story = {
  args: {
    label: 'Gender',
    name: 'gender',
    options: genderOptions,
    value: 'female',
  },
}

/**
 * Select field with many options
 */
export const ManyOptions: Story = {
  args: {
    label: 'Country',
    name: 'country',
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
    value: '',
  },
}
