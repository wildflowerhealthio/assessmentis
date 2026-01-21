import { PatientPicker } from '../../../Patient/components/PatientPicker'
import { EncounterPicker } from '../../../Encounter/components/EncounterPicker'
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
        <PatientPicker
          picking={{
            value: Promise.resolve(patientId ?? undefined),
            onChange: onPatientChange,
            multiple: false,
          }}
          label="Filter by Patient"
          placeholder="All patients..."
        />
        <EncounterPicker
          picking={{
            value: Promise.resolve(selectedEncounterIds),
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
