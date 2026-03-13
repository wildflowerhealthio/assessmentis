import { string } from 'fast-check'
import { Effect } from 'effect'
import type { JSX } from 'react'

import {
  ClinicalDomainHub,
  type Observation,
} from '@assessmentis/clinical-domain'
import type { Reference } from '@assessmentis/clinical-domain/data-types'
import type { Resource } from '@assessmentis/effectful-store'
import { gad7 } from '@assessmentis/questionnaire-entities'

import { NotFoundError } from '@assessmentis/ontology'
import type { ComponentFamily } from '../../types'

export const gad7Report = (
  {
    components: {
      TitleComponent,
      ObservationTableComponent,
      ObservationSectionWithMethodComponent,
    },
  }: ComponentFamily,
  patientReference: Reference
): Effect.Effect<JSX.Element, unknown, ClinicalDomainHub> =>
  Effect.gen(function* () {
    const hub = yield* ClinicalDomainHub
    const title = <TitleComponent title="GAD-7 Report" />

    const observations = yield* hub.search('Observation', {
      subject: patientReference.reference,
    } as const)

    const gad7Observations = gad7.questionnaire.item
      ?.map((item) =>
        observations.find(
          (obs) => item.code?.[0]?.code === obs.code.coding?.[0]?.code
        )
      )
      .filter((o): o is Resource.WithResourceUrl<Observation> => Boolean(o))

    if (
      gad7Observations == undefined ||
      gad7Observations.length != 7 ||
      gad7Observations.some((obs) => obs === undefined)
    ) {
      return yield* Effect.fail(
        new NotFoundError({
          resourceType: 'Observation',
          params: {
            subject: patientReference.reference,
            code: string,
          },
        }) // ('GAD-7 score observation not found for the patient')
      )
    }

    const scoreObservations = observations.find(
      (obs) => gad7.codings.totalScore.code === obs.code.coding?.[0]?.code
    )

    if (!scoreObservations) {
      return yield* Effect.fail(
        new NotFoundError({
          resourceType: 'Observation',
          params: {
            subject: patientReference.reference,
            code: gad7.codings.totalScore.code,
          },
        }) // ('GAD-7 score observation not found for the patient')
      )
    }
    return (
      <div>
        {title} This is a GAD-7 Report
        <ObservationTableComponent
          observationLabel="Question"
          observations={gad7Observations}
          columns={[
            {
              label: gad7.codings.notAtAll.display,
              codings: [gad7.codings.notAtAll],
            },
            {
              label: gad7.codings.severalDays.display,
              codings: [gad7.codings.severalDays],
            },
            {
              label: gad7.codings.moreThanHalfTheDays.display,
              codings: [gad7.codings.moreThanHalfTheDays],
            },
            {
              label: gad7.codings.nearlyEveryDay.display,
              codings: [gad7.codings.nearlyEveryDay],
            },
          ]}
        />
        <ObservationSectionWithMethodComponent
          observation={scoreObservations}
        />
        <pre>{JSON.stringify(gad7Observations, null, 2)}</pre>
      </div>
    )
  })
