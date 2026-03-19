import { useLocation, useNavigate } from 'react-router'

import { cn } from '@assessmentis/react-util'

import classes from './OptionalBackButton.module.css'

export const OptionalBackButton = (): React.JSX.Element => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <button
      style={{ display: pathname === '/' ? 'none' : undefined }}
      onClick={() => navigate(-1)}
      className={cn(
        'element-button',
        'button-1',
        'ghost',
        'text-alt-heading-3',
        classes.OptionalBackButton
      )}
      aria-label="Go back"
    >
      ←
    </button>
  )
}
