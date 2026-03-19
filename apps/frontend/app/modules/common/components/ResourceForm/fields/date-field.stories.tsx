import type { Meta, StoryObj } from '@storybook/react-vite'

import { useArgs } from 'storybook/internal/preview-api'

import { DateField } from './date-field'

const meta: Meta<typeof DateField> = {
  component: DateField,
  parameters: {
    layout: 'centered',
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()

    function onChange(val: Date | undefined): void {
      updateArgs({ value: val })
    }

    return <DateField {...args} onChange={onChange} />
  },
  tags: ['autodocs'],
  title: 'Components/Form Fields/DateField',
}

export default meta
type Story = StoryObj<typeof DateField>

/**
 * Default date field with no value
 */
export const Default: Story = {
  args: {
    label: 'Birth Date',
    name: 'birthDate',
    value: undefined,
  },
}

/**
 * Date field with a pre-selected date
 */
export const WithValue: Story = {
  args: {
    label: 'Birth Date',
    name: 'birthDate',
    value: new Date('1990-01-15'),
  },
}

/**
 * Required date field
 */
export const Required: Story = {
  args: {
    label: 'Birth Date',
    name: 'birthDate',
    required: true,
    value: undefined,
  },
}

/**
 * Date field with error
 */
export const WithError: Story = {
  args: {
    error: 'Birth date is required',
    label: 'Birth Date',
    name: 'birthDate',
    value: undefined,
  },
}

/**
 * Disabled date field
 */
export const Disabled: Story = {
  args: {
    label: 'Birth Date',
    name: 'birthDate',
    value: new Date('1990-01-15'),
  },
}
