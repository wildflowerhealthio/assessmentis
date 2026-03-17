import { expect } from 'vitest'
import { Cause, Exit, Option, pipe } from 'effect'
import type { Layer } from 'effect'

import type { FhirR4Client } from './FhirR4Client'
import { describeAsFhirR4ResourceClient } from './FhirR4Client.interface.test'

/**
 * Pre-configured test suite for Patient resource compliance.
 */
export const describeAsFhirR4PatientClient = (
  FhirR4ClientLayer: Layer.Layer<FhirR4Client, never, never>
) =>
  describeAsFhirR4ResourceClient(FhirR4ClientLayer, 'Patient', {
    nonExistentResourceId: 'non-existent-patient-id-12345',

    createAndRead: {
      cases: [
        {
          name: 'a test patient',
          resource: {
            resourceType: 'Patient',
            name: [{ given: ['Test'], family: 'Patient' }],
            active: true,
          },
        },
        {
          name: 'another test patient',
          resource: {
            resourceType: 'Patient',
            name: [{ given: ['Another'], family: 'TestPatient' }],
          },
        },
      ],
      assertion: (input, output) => {
        const inputPatient = input as { resourceType: string }
        const outputPatient = output as { resourceType: string; id: string }
        expect(outputPatient.resourceType).toBe('Patient')
        expect(outputPatient.id).toBeTruthy()
        expect(inputPatient.resourceType).toBe(outputPatient.resourceType)
      },
    },

    updateAndRead: {
      initial: {
        resourceType: 'Patient',
        name: [{ given: ['Before'], family: 'Update' }],
      },
      cases: [
        {
          name: 'updating the name',
          update: {
            resourceType: 'Patient',
            name: [{ given: ['After'], family: 'Update' }],
          },
        },
      ],
      assertion: (before, updateResponse, read) => {
        const beforePatient = before as { id: string }
        const updatedPatient = updateResponse as {
          id: string
          resourceType: string
        }
        const readPatient = read as { id: string; resourceType: string }

        expect(updatedPatient.resourceType).toBe('Patient')
        expect(updatedPatient.id).toBe(beforePatient.id)
        expect(readPatient.id).toBe(beforePatient.id)
      },
    },

    createDeleteRead: {
      cases: [
        {
          name: 'a patient to delete',
          resource: {
            resourceType: 'Patient',
            name: [{ given: ['ToDelete'], family: 'Patient' }],
          },
        },
      ],
      assertion: (_resource, _deleteResult, readExit) => {
        expect(Exit.isFailure(readExit)).toBe(true)
        if (Exit.isFailure(readExit)) {
          const error = pipe(
            readExit,
            Exit.causeOption,
            Option.flatMap(Cause.failureOption),
            Option.getOrThrow
          )
          expect((error as { _tag: string })._tag).toBe('NotFoundError')
        }
      },
    },

    createManyAndSearch: {
      toCreate: [
        {
          resourceType: 'Patient',
          name: [{ given: ['Search1'], family: 'TestPatient' }],
        },
        {
          resourceType: 'Patient',
          name: [{ given: ['Search2'], family: 'TestPatient' }],
        },
      ],
      cases: [
        {
          params: { _count: '10' },
          name: 'searching all patients',
          assertion: (result) => {
            const bundle = result as {
              resourceType: string
              type: string
              total?: number
            }
            expect(bundle.resourceType).toBe('Bundle')
            expect(bundle.type).toBe('searchset')
            expect(
              typeof bundle.total === 'number' || bundle.total === undefined
            ).toBe(true)
          },
        },
      ],
    },
  })
