import { Link } from 'react-router'
import classes from './NavHeader.module.css'
import { cn } from '@assessmentis/react-util'
import { useRef, useState } from 'react'
import { useOutsideClickHandler } from '@assessmentis/react-util/hooks'
import { LoginButton } from '../LoginButton'

const NavHeader = () => {
  const [showMenu, setShowMenu] = useState(false)

  const navRef = useRef<HTMLElement | null>(null)
  useOutsideClickHandler(navRef, () => {
    setShowMenu(false)
  })

  return (
    <header className={classes.NavHeader}>
      <Link to="/">
        <h1
          className={cn(
            'text-alt-heading-3 svelte',
            classes.NavHeader__backLink
          )}
          style={{ marginRight: 'var(--space-5)' }}
        >
          Assessment.is
        </h1>
      </Link>
      <nav ref={navRef} className={classes.NavHeader__nav}>
        <button
          aria-label={showMenu ? 'Show menu' : 'Hide menu'}
          className={cn(
            'element-button button-1 ghost',
            showMenu && 'show',
            classes.NavHeader__button
          )}
          onClick={() => setShowMenu((showMenu) => !showMenu)}
        >
          <div></div>
        </button>
        {showMenu ? (
          <menu className={classes.NavHeader__menu}>
            <Link
              className={cn('heading-2', classes.NavHeader__link)}
              to="/Encounter"
            >
              Encounters
            </Link>

            <Link
              className={cn('heading-2', classes.NavHeader__link)}
              to="/Patient"
            >
              Patients
            </Link>

            <hr />

            <Link
              className={cn('heading-2', classes.NavHeader__link)}
              to="/Composition"
            >
              Compositions
            </Link>

            <Link
              className={cn('heading-2', classes.NavHeader__link)}
              to="/Observation"
            >
              Observations
            </Link>

            <hr />

            <Link
              className={cn('heading-2', classes.NavHeader__link)}
              to="/Questionnaire"
            >
              Questionnaires
            </Link>

            <Link
              className={cn('heading-2', classes.NavHeader__link)}
              to="/QuestionnaireResponse"
            >
              Questionnaire Responses
            </Link>

            <hr />

            <Link
              className={cn('heading-2', classes.NavHeader__link)}
              to="/Practitioner"
            >
              Practitioners
            </Link>

            <LoginButton className={cn('heading-2', classes.NavHeader__link)} />
          </menu>
        ) : undefined}
      </nav>
    </header>
  )
}

export default NavHeader
