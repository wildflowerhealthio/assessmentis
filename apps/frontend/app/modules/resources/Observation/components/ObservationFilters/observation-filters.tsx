import { Encounter, Patient } from '@assessmentis/clinical-domain'

import { ResourcePicker } from '../../../../ResourcePicker/resource-picker'
import classes from './ObservationFilters.module.css'

interface ObservationFiltersProps {
  patientId: string | null
  encounterId: string | null
  onPatientChange: (id: string | undefined) => void
  onEncounterChange: (ids: readonly string[] | undefined) => void
}

export function ObservationFilters({
  patientId,
  encounterId,
  onPatientChange,
  onEncounterChange,
}: ObservationFiltersProps): React.JSX.Element {
  const selectedEncounterIds = encounterId
    ? encounterId.split(',').filter((id) => id.trim())
    : undefined

  return (
    <section className={classes.Filters}>
      <h2 className="heading-4">Filter Observations</h2>
      <div className={classes.Filters__grid}>
        <ResourcePicker
          klass={Patient}
          picking={{
            multiple: false,
            onChange: onPatientChange,
            value: patientId ?? undefined,
          }}
          label="Filter by Patient"
          placeholder="All patients..."
        />
        <ResourcePicker
          klass={Encounter}
          picking={{
            multiple: true,
            onChange: onEncounterChange,
            value: selectedEncounterIds,
          }}
          label="Filter by Encounters"
          placeholder="All encounters..."
        />
      </div>
    </section>
  )
}
