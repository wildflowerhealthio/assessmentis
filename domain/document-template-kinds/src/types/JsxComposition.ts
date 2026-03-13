import type React from 'react'

import type { Composition } from '@assessmentis/clinical-domain'

export interface JsxComposition {
  jsx: React.JSX.Element
  composition: Composition
}
