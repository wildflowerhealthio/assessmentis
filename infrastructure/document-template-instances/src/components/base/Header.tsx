import React from 'react'
import { JsxCompositionSectionComponent } from '@assessmentis/document-template-kinds'
import { renderToStaticMarkup } from 'react-dom/server'

export const Header: JsxCompositionSectionComponent<{ title: string }> = ({
  title,
}) => {
  const jsx = <h1>{title}</h1>

  return {
    jsx,
    compositionSection: {
      title,
      text: {
        status: 'generated',
        div: renderToStaticMarkup(jsx),
      },
    },
  }
}
