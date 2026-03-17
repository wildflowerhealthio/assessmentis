import { Encounter, Patient } from '@assessmentis/clinical-domain'

import { ResourcePicker } from '../../../../ResourcePicker/ResourcePicker'
import classes from './ObservationFilters.module.css'

interface ObservationFiltersProps {
  patientId: string | null
  encounterId: string | null
  onPatientChange: (id: string | undefined) => void
  onEncounterChange: (ids: ReadonlyArray<string> | undefined) => void
}

export function ObservationFilters({
  patientId,
  encounterId,
  onPatientChange,
  onEncounterChange,
}: ObservationFiltersProps) {
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
            value: patientId ?? undefined,
            onChange: onPatientChange,
            multiple: false,
          }}
          label="Filter by Patient"
          placeholder="All patients..."
        />
        <ResourcePicker
          klass={Encounter}
          picking={{
            value: selectedEncounterIds,
            onChange: onEncounterChange,
            multiple: true,
          }}
          label="Filter by Encounters"
          placeholder="All encounters..."
        />
      </div>
    </section>
  )
}
