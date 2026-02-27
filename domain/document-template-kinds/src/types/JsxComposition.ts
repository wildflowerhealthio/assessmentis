import type { Composition } from '@assessmentis/clinical-domain'
import type React from 'react'

export interface JsxComposition {
  jsx: React.JSX.Element
  composition: Composition
}
