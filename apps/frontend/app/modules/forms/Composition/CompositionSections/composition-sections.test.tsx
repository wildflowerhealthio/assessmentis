import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Composition } from '@assessmentis/clinical-domain'

import { CompositionSections } from './composition-sections'

/** Builds a minimal Composition with a single section containing the given HTML div. */
function compositionWithDiv(div: string): Composition {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- minimal stub for rendering test
  return {
    resourceType: 'Composition',
    section: [
      {
        text: { status: 'generated', div },
      },
    ],
  } as unknown as Composition
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
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- minimal stub
    const composition = { resourceType: 'Composition', section: [] } as unknown as Composition
    const { container } = render(<CompositionSections composition={composition} />)

    expect(container.innerHTML).toBe('')
  })
})
