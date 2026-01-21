import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/internal/preview-api'
import { DateField } from './DateField'

const meta: Meta<typeof DateField> = {
  title: 'Components/Form Fields/DateField',
  component: DateField,
  parameters: {
    layout: 'centered',
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()

    function onChange(val: Date | undefined) {
      updateArgs({ value: val })
    }

    return <DateField {...args} onChange={onChange} />
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof DateField>

/**
 * Default date field with no value
 */
export const Default: Story = {
  args: {
    name: 'birthDate',
    label: 'Birth Date',
    value: undefined,
  },
}

/**
 * Date field with a pre-selected date
 */
export const WithValue: Story = {
  args: {
    name: 'birthDate',
    label: 'Birth Date',
    value: Promise.resolve(new Date('1990-01-15')),
  },
}

/**
 * Required date field
 */
export const Required: Story = {
  args: {
    name: 'birthDate',
    label: 'Birth Date',
    value: undefined,
    required: true,
  },
}

/**
 * Date field with error
 */
export const WithError: Story = {
  args: {
    name: 'birthDate',
    label: 'Birth Date',
    value: undefined,
    error: 'Birth date is required',
  },
}

/**
 * Disabled date field
 */
export const Disabled: Story = {
  args: {
    name: 'birthDate',
    label: 'Birth Date',
    value: Promise.resolve(new Date('1990-01-15')),
  },
}
