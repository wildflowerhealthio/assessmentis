import { render, screen } from '@testing-library/react'
import { DateTime, Effect } from 'effect'
import { describe, expect, it } from 'vitest'

import { Composition, CompositionSection } from '@assessmentis/clinical-domain'
import { CodeableConcept, Narrative, Reference } from '@assessmentis/clinical-domain/data-types'

import { CompositionSections } from './composition-sections'

/** Builds a minimal Composition with a single section containing the given HTML div. */
function compositionWithDiv(div: string): Composition {
  return Composition.make({
    author: [Reference.make({ display: 'Test Author' })],
    date: Effect.runSync(DateTime.now),
    section: [CompositionSection.make({ text: Narrative.make({ status: 'generated', div }) })],
    status: 'final',
    title: 'Test Composition',
    type: CodeableConcept.make({ coding: [] }),
  })
}

describe('CompositionSections', () => {
  it('renders safe HTML content unchanged', () => {
    const safeHtml = '<p>Hello world</p>'
    render(<CompositionSections composition={compositionWithDiv(safeHtml)} />)

    expect(screen.getByText('Hello world')).toBeDefined()
  })

  it('strips script tags from HTML content', () => {
    const maliciousHtml = '<p>Safe text</p><script>alert("xss")</script>'
    const { container } = render(
      <CompositionSections composition={compositionWithDiv(maliciousHtml)} />
    )

    expect(screen.getByText('Safe text')).toBeDefined()
    expect(container.querySelector('script')).toBeNull()
  })

  it('strips event handler attributes from HTML content', () => {
    const maliciousHtml = '<p onmouseover="alert(1)">Hover me</p>'
    const { container } = render(
      <CompositionSections composition={compositionWithDiv(maliciousHtml)} />
    )

    const paragraph = container.querySelector('p')
    expect(paragraph).not.toBeNull()
    expect(paragraph?.getAttribute('onmouseover')).toBeNull()
  })

  it('returns null when composition has no sections', () => {
    const composition = Composition.make({
      author: [Reference.make({ display: 'Test Author' })],
      date: Effect.runSync(DateTime.now),
      section: [],
      status: 'final',
      title: 'Test Composition',
      type: CodeableConcept.make({ coding: [] }),
    })
    const { container } = render(<CompositionSections composition={composition} />)

    expect(container.innerHTML).toBe('')
  })
})
