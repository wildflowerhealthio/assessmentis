import {
  ScoringProps,
  TitleProps,
  TableRowProps,
  TableBodyProps,
} from './componentProps'
import { IntermediateCompositionSection } from '../../utility/IntermediateComposition'
import { SectionRenderers } from './SectionRenderers'

/**
 * Renders the title section content using the provided renderer
 */
export const renderTitleSection =
  <Out>(renderer: SectionRenderers<Out>) =>
  (props: TitleProps): IntermediateCompositionSection<Out> => ({
    out: renderer.Title(props),
  })

/**
 * Renders the table header section content using the provided renderer
 */
export const renderTableHeaderSection =
  <Out>(renderer: SectionRenderers<Out>) =>
  (): IntermediateCompositionSection<Out> => ({
    out: renderer.TableHeader(),
  })

/**
 * Renders a single table row section content using the provided renderer
 */
export const renderTableRowSection =
  <Out>(renderer: SectionRenderers<Out>) =>
  (props: TableRowProps): IntermediateCompositionSection<Out> => ({
    out: renderer.TableRow(props),
  })

/**
 * Renders the table body section content (all rows) using the provided renderer
 */
export const renderTableBodySection =
  <Out>(renderer: SectionRenderers<Out>) =>
  (props: TableBodyProps<Out>): IntermediateCompositionSection<Out> => ({
    out: renderer.TableBody(props),
  })

/**
 * Renders the scoring section content using the provided renderer
 */
export const renderScoringSection =
  <Out>(renderer: SectionRenderers<Out>) =>
  (props: ScoringProps): IntermediateCompositionSection<Out> => ({
    out: renderer.Scoring(props),
  })
