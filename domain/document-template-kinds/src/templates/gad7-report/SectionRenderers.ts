import { JsxCompositionSectionContainer } from '../../utility/JsxCompositionSection'

export interface SectionRenderers<Errs, Context> {
  Title: () => JsxCompositionSectionContainer<object, Errs, Context>
  TableHeader: () => JsxCompositionSectionContainer<object, Errs, Context>
  TableRow: () => JsxCompositionSectionContainer<object, Errs, Context>
  TableBody: () => JsxCompositionSectionContainer<object, Errs, Context>
  Scoring: () => JsxCompositionSectionContainer<object, Errs, Context>
}
