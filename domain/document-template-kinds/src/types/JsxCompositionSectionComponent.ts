import type { JsxCompositionSection } from './JsxCompositionSection'

export type JsxCompositionSectionComponent<P extends object> = (
  props: P
) => JsxCompositionSection
