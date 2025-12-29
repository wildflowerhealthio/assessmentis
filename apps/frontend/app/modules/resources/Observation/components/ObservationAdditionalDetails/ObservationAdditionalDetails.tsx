import type { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { DetailGrid } from 'app/modules/common/components/DetailGrid/DetailGrid'

interface ObservationAdditionalDetailsProps {
  observation: Observation
}

export function ObservationAdditionalDetails({
  observation,
}: ObservationAdditionalDetailsProps) {
  const items = []

  if (observation.method) {
    items.push({
      label: 'Method',
      value:
        observation.method.text ??
        observation.method.coding?.[0]?.display ??
        'Unknown',
    })
  }

  if (observation.bodySite) {
    items.push({
      label: 'Body Site',
      value:
        observation.bodySite.text ??
        observation.bodySite.coding?.[0]?.display ??
        'Unknown',
    })
  }

  if (observation.device?.reference) {
    items.push({
      label: 'Device',
      value: observation.device.display ?? observation.device.reference,
    })
  }

  if (observation.specimen?.reference) {
    items.push({
      label: 'Specimen',
      value: observation.specimen.display ?? observation.specimen.reference,
    })
  }

  if (observation.note && observation.note.length > 0) {
    items.push({
      label: 'Notes',
      value: observation.note.map((note) => note.text).join('\n'),
    })
  }

  if (items.length === 0) {
    return null
  }

  return <DetailGrid items={items} />
}
