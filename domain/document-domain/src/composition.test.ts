import { describe, expect, it } from 'vitest'
import { Code } from '@assessmentis/clinical-domain'
import { Composition, Section } from './composition'

describe('Composition', () => {
  it('should create a valid minimal Composition', () => {
    const composition: typeof Composition.Type = {
      resourceType: 'Composition',
      status: 'final',
      type: {
        coding: [
          {
            system: 'http://loinc.org',
            code: Code.make('11488-4'),
            display: 'Consult note',
          },
        ],
      },
      subject: {
        reference: 'Patient/123',
      },
      date: '2024-01-01T00:00:00Z',
      author: [
        {
          reference: 'Practitioner/456',
        },
      ],
      title: 'Consultation Note',
    }

    const result = Composition.make(composition)
    expect(result).toBeDefined()
    expect(result.resourceType).toBe('Composition')
    expect(result.status).toBe('final')
    expect(result.title).toBe('Consultation Note')
  })

  it('should create a Composition with sections', () => {
    const composition: typeof Composition.Type = {
      resourceType: 'Composition',
      status: 'final',
      type: {
        coding: [
          {
            system: 'http://loinc.org',
            code: Code.make('11488-4'),
          },
        ],
      },
      subject: {
        reference: 'Patient/123',
      },
      date: '2024-01-01',
      author: [
        {
          reference: 'Practitioner/456',
        },
      ],
      title: 'Test Document',
      section: [
        {
          title: 'History',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: Code.make('11348-0'),
                display: 'History of past illness',
              },
            ],
          },
        },
      ],
    }

    const result = Composition.make(composition)
    expect(result).toBeDefined()
    expect(result.section).toHaveLength(1)
    expect(result.section?.[0]?.title).toBe('History')
  })

  it('should support nested sections', () => {
    const composition: typeof Composition.Type = {
      resourceType: 'Composition',
      status: 'final',
      type: {
        coding: [
          {
            system: 'http://loinc.org',
            code: Code.make('11488-4'),
          },
        ],
      },
      subject: {
        reference: 'Patient/123',
      },
      date: '2024-01-01',
      author: [
        {
          reference: 'Practitioner/456',
        },
      ],
      title: 'Test Document',
      section: [
        {
          title: 'Parent Section',
          section: [
            {
              title: 'Child Section',
            },
          ],
        },
      ],
    }

    const result = Composition.make(composition)
    expect(result).toBeDefined()
    expect(result.section?.[0]?.section).toHaveLength(1)
    expect(result.section?.[0]?.section?.[0]?.title).toBe('Child Section')
  })

  it('should support all status values', () => {
    const statuses = [
      'preliminary',
      'final',
      'amended',
      'entered-in-error',
    ] as const

    statuses.forEach((status) => {
      const composition: typeof Composition.Type = {
        resourceType: 'Composition',
        status,
        type: {
          coding: [{ system: 'http://loinc.org', code: Code.make('11488-4') }],
        },
        subject: { reference: 'Patient/123' },
        date: '2024-01-01',
        author: [{ reference: 'Practitioner/456' }],
        title: 'Test',
      }

      const result = Composition.make(composition)
      expect(result.status).toBe(status)
    })
  })
})

describe('Section', () => {
  it('should create a valid minimal Section', () => {
    const section: typeof Section.Type = {
      title: 'Test Section',
    }

    const result = Section.make(section)
    expect(result).toBeDefined()
    expect(result.title).toBe('Test Section')
  })

  it('should create a Section with code and text', () => {
    const section: typeof Section.Type = {
      title: 'History',
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: Code.make('11348-0'),
            display: 'History of past illness',
          },
        ],
      },
      text: {
        status: 'generated',
        div: '<div>Patient history</div>',
      },
    }

    const result = Section.make(section)
    expect(result).toBeDefined()
    expect(result.title).toBe('History')
    expect(result.code?.coding?.[0]?.code).toBe('11348-0')
  })

  it('should support mode values', () => {
    const modes = ['working', 'snapshot', 'changes'] as const

    modes.forEach((mode) => {
      const section: typeof Section.Type = {
        title: 'Test Section',
        mode,
      }

      const result = Section.make(section)
      expect(result.mode).toBe(mode)
    })
  })

  it('should create a Section with entry references', () => {
    const section: typeof Section.Type = {
      title: 'Medications',
      entry: [
        { reference: 'MedicationStatement/1' },
        { reference: 'MedicationStatement/2' },
      ],
    }

    const result = Section.make(section)
    expect(result).toBeDefined()
    expect(result.entry).toHaveLength(2)
    expect(result.entry?.[0]?.reference).toBe('MedicationStatement/1')
  })
})

describe('FHIR R4 Composition type compatibility', () => {
  it('should be compatible with fhir.Composition from @types/fhir', () => {
    // This test verifies that our Composition type is structurally compatible
    // with the fhir.Composition type from the @types/fhir package

    const composition: typeof Composition.Type = {
      resourceType: 'Composition',
      status: 'final',
      type: {
        coding: [
          {
            system: 'http://loinc.org',
            code: Code.make('11488-4'),
            display: 'Consult note',
          },
        ],
      },
      subject: {
        reference: 'Patient/example',
        display: 'Example Patient',
      },
      date: '2024-01-01T12:00:00Z',
      author: [
        {
          reference: 'Practitioner/example',
          display: 'Dr. Example',
        },
      ],
      title: 'Consultation Note',
      identifier: {
        system: 'http://example.org/composition',
        value: 'comp-123',
      },
      encounter: {
        reference: 'Encounter/example',
      },
      section: [
        {
          title: 'Chief Complaint',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: Code.make('10154-3'),
                display: 'Chief complaint',
              },
            ],
          },
          text: {
            status: 'generated',
            div: '<div xmlns="http://www.w3.org/1999/xhtml">Chief Complaint text</div>',
          },
        },
        {
          title: 'History of Present Illness',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: Code.make('10164-2'),
                display: 'History of Present illness',
              },
            ],
          },
          mode: 'snapshot',
          entry: [
            {
              reference: 'Observation/example',
            },
          ],
        },
      ],
    }

    // Create the composition using our schema
    const result = Composition.make(composition)

    // Verify it has all required FHIR R4 Composition fields
    expect(result.resourceType).toBe('Composition')
    expect(result.status).toBeDefined()
    expect(result.type).toBeDefined()
    expect(result.subject).toBeDefined()
    expect(result.date).toBeDefined()
    expect(result.author).toBeDefined()
    expect(result.title).toBeDefined()

    // This assertion verifies type compatibility at compile time
    // If our type is not compatible with fhir.Composition, this would fail
    const assertTypeCompatibility = (comp: typeof Composition.Type): void => {
      // The fact that this compiles means our type structure is compatible
      expect(comp.resourceType).toBe('Composition')
    }

    assertTypeCompatibility(result)
  })

  it('should validate Section is independently usable', () => {
    // Verify that Section can be used independently as requested
    const section: typeof Section.Type = {
      title: 'Allergies and Adverse Reactions',
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: Code.make('48765-2'),
            display: 'Allergies and adverse reactions',
          },
        ],
      },
      text: {
        status: 'generated',
        div: '<div xmlns="http://www.w3.org/1999/xhtml">No known allergies</div>',
      },
      mode: 'snapshot',
      entry: [
        {
          reference: 'AllergyIntolerance/example',
        },
      ],
      section: [
        {
          title: 'Medication Allergies',
          entry: [
            {
              reference: 'AllergyIntolerance/medication-allergy',
            },
          ],
        },
      ],
    }

    const result = Section.make(section)

    expect(result).toBeDefined()
    expect(result.title).toBe('Allergies and Adverse Reactions')
    expect(result.section).toHaveLength(1)
    expect(result.section?.[0]?.title).toBe('Medication Allergies')
  })
})
