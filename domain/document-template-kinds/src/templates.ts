import {
  Composition,
  CompositionSection,
} from '@assessmentis/clinical-domain/content-management'

/**
 * Template for rendering a full FHIR Composition document
 */
export interface CompositionTemplate<Props> {
  /**
   * Unique name identifier for this template
   */
  name: string
  /**
   * Human-readable title for the composition
   */
  title: string
  /**
   * Render the composition from the provided props
   */
  render(props: Props): Composition
}

/**
 * Template for rendering a FHIR CompositionSection
 */
export interface CompositionSectionTemplate<Props> {
  /**
   * Unique name identifier for this section template
   */
  name: string
  /**
   * Human-readable title for the section
   */
  title: string
  /**
   * Render the section from the provided props
   */
  render(props: Props): CompositionSection
}
