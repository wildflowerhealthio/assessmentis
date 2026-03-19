'use client'

import type { FallbackProps } from 'react-error-boundary'

export const JsonErrorDisplay = (props: FallbackProps): React.JSX.Element => (
  <pre style={{ maxWidth: 1024, textWrap: 'wrap' }}>{JSON.stringify(props.error, null, '  ')}</pre>
)
