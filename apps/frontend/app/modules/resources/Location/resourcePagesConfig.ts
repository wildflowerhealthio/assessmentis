import { Schema } from 'effect'

import type { Location } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import {
  createResourceCreateAction,
  createResourceUpdateAction,
} from '../../common/actions/createResourceActions'
import type { ResourcePagesConfig } from '../ResourcePages/resourcePagesConfigType'
import { LocationForm } from './components/LocationForm'
import {
  LocationFormSchema,
  transformToLocation,
  type LocationFormData,
} from './schemas/LocationFormSchema'
import { getLocationDisplayName } from './utils/locationDisplay'

export const locationConfig: ResourcePagesConfig<
  Location,
  typeof LocationFormSchema
> = {
  resourceType: 'Location',
  singularLabel: 'Location',
  pluralLabel: 'Locations',
  paramName: 'locationId',

  decodeUrl: (raw: string) => Schema.decodeOption(ReadonlyUrl.FromString)(raw),
  getDisplayName: getLocationDisplayName,

  schema: LocationFormSchema,
  FormComponent: LocationForm,

  defaultFormValues: {
    name: '',
    description: undefined,
    status: undefined,
    mode: undefined,
    identifierSystem: undefined,
    identifierValue: undefined,
  },

  extractFormValues: (location) => ({
    name: location.name ?? '',
    description: location.description ?? undefined,
    status: location.status ?? undefined,
    mode: location.mode ?? undefined,
    identifierSystem: location.identifier?.[0]?.system ?? undefined,
    identifierValue: location.identifier?.[0]?.value ?? undefined,
  }),

  createAction: createResourceCreateAction<LocationFormData, 'Location'>(
    'Location',
    transformToLocation
  ),
  updateAction: createResourceUpdateAction<LocationFormData, 'Location'>(
    'Location',
    transformToLocation
  ),

  getListSummaryItems: (location) =>
    [location.status, location.mode].filter(
      (v): v is NonNullable<typeof v> => v != null
    ) as string[],
}
