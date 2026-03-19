import type { JsxCompositionSection } from './jsx-composition-section'

export type JsxCompositionSectionComponent<P extends object> = (props: P) => JsxCompositionSection
