import { Schema } from 'effect'
import { JSX, isValidElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const JsxFromSelf = Schema.declare((input: unknown): input is JSX.Element =>
  isValidElement(input)
)

export const HtmlFromJsx = Schema.transform(Schema.String, JsxFromSelf, {
  strict: true,
  decode: (_html): never => {
    throw new Error('HtmlFromJsx is only for encoding')
  },
  encode: (jsx) => renderToStaticMarkup(jsx),
})
