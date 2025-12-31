import { Effect } from 'effect'
import { BaseClinicalDataRepository } from '@assessmentis/clinical-domain'
import { ClientRuntimeContext } from '../../../../../../domain/platform-domain/src/UserPlatformService'
import { BasePicker } from '../components/BasePicker/BasePicker'
import { usePickerData } from '../components/BasePicker/hooks/usePickerData'
import {
  BasePickerProps,
  PickerItem,
} from '../components/BasePicker/types/PickerTypes'

/**
 * Configuration for creating a resource picker component
 */
export interface ResourcePickerConfig<TResource extends { id?: string }> {
  repository: Effect.Effect<
    BaseClinicalDataRepository<TResource, string>,
    never,
    ClientRuntimeContext
  >
  formatDisplay: (resource: TResource) => string
  formatSecondary: (resource: TResource) => string
  defaultPlaceholder: string
  defaultLabel: string
}

/**
 * Creates a resource picker component with standardized behavior
 *
 * This factory function reduces duplication across resource pickers by
 * encapsulating the common pattern of:
 * 1. Transforming resources to picker items
 * 2. Using usePickerData hook
 * 3. Spreading props to BasePicker with defaults
 *
 * @example
 * ```typescript
 * export const PatientPicker = createResourcePicker({
 *   repository: PatientRepository,
 *   formatDisplay: (p) => formatHumanName(p.name?.[0], 'Unnamed Patient'),
 *   formatSecondary: (p) => `${formatGender(p.gender)} • Born: ${formatDate(p.birthDate)}`,
 *   defaultPlaceholder: 'Select a patient...',
 *   defaultLabel: 'Patient',
 * })
 * ```
 */
export function createResourcePicker<TResource extends { id?: string }>(
  config: ResourcePickerConfig<TResource>
) {
  return function ResourcePicker(
    props: Omit<BasePickerProps<{ resource: TResource }>, 'items' | 'loading'>
  ) {
    const { items, loading, error } = usePickerData({
      repository: config.repository,
      transform: (
        resource: TResource
      ): PickerItem<{ resource: TResource }> => ({
        id: resource.id!,
        displayName: config.formatDisplay(resource),
        secondaryText: config.formatSecondary(resource),
        metadata: { resource },
      }),
    })

    return (
      <BasePicker
        {...props}
        items={items}
        loading={loading}
        error={error?.message || props.error}
        immediate={props.immediate ?? true}
        placeholder={props.placeholder || config.defaultPlaceholder}
        label={props.label || config.defaultLabel}
      />
    )
  }
}
