import type { Composition } from '@assessmentis/clinical-domain/content-management'
import type React from 'react'

export interface JsxComposition {
  jsx: React.JSX.Element
  composition: Composition
}
