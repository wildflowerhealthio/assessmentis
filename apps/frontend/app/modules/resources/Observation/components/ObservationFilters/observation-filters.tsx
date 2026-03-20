import { Encounter, Patient } from '@assessmentis/clinical-domain'

import { ResourcePicker } from '../../../../ResourcePicker/resource-picker'
import classes from './ObservationFilters.module.css'

interface ObservationFiltersProps {
  patientUrl: string | null
  encounterUrl: string | null
  onPatientChange: (url: string | undefined) => void
  onEncounterChange: (urls: readonly string[] | undefined) => void
}

export function ObservationFilters({
  patientUrl,
  encounterUrl,
  onPatientChange,
  onEncounterChange,
}: ObservationFiltersProps): React.JSX.Element {
  const selectedEncounterUrls = encounterUrl
    ? encounterUrl.split(',').filter((url) => url.trim())
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
            value: patientUrl ?? undefined,
          }}
          label="Filter by Patient"
          placeholder="All patients..."
        />
        <ResourcePicker
          klass={Encounter}
          picking={{
            multiple: true,
            onChange: onEncounterChange,
            value: selectedEncounterUrls,
          }}
          label="Filter by Encounters"
          placeholder="All encounters..."
        />
      </div>
    </section>
  )
}
