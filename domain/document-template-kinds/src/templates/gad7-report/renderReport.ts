import { SectionRenderers } from './SectionRenderers'
import { ReportProps } from './ReportProps'
import {
  renderTitleSection,
  renderTableHeaderSection,
  renderTableRowSection,
  renderTableBodySection,
  renderScoringSection,
} from './reportRenderers'
import { IntermediateCompositionSection } from '../../utility/IntermediateComposition'

/**
 * Renders a GAD7 report by composing smaller section renderers into a full composition.
 * Each section is rendered independently using the provided renderers and then composed together.
 * Returns an object with all sections composed as IntermediateCompositionSections.
 */
export const renderReport = <Out>(
  props: ReportProps,
  renderers: SectionRenderers<Out>
): { section: ReadonlyArray<IntermediateCompositionSection<Out>> } => {
  // Render individual sections
  const titleSection = renderTitleSection(renderers)(props.title)
  const tableHeaderSection = renderTableHeaderSection(renderers)()

  // Render each row as a section
  const rowSections: IntermediateCompositionSection<Out>[] = props.rows.map(
    (row) => renderTableRowSection(renderers)(row)
  )

  // Create a TableBodyProps-like object with rendered sections
  const tableBodyProps = {
    rows: rowSections as [
      IntermediateCompositionSection<Out>,
      IntermediateCompositionSection<Out>,
      IntermediateCompositionSection<Out>,
      IntermediateCompositionSection<Out>,
      IntermediateCompositionSection<Out>,
      IntermediateCompositionSection<Out>,
      IntermediateCompositionSection<Out>,
    ],
  }

  const tableBodySection = renderTableBodySection(renderers)(tableBodyProps)
  const scoringSection = renderScoringSection(renderers)(props.scoring)

  // Compose all sections into the final composition
  return {
    section: [
      titleSection,
      tableHeaderSection,
      tableBodySection,
      scoringSection,
    ],
  }
}
