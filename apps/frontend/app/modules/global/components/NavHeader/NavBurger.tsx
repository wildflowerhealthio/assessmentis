import { useOutsideClickHandler, cn } from '@assessmentis/react-util'
import { useState, useRef } from 'react'
import { Link } from 'react-router'
import { LoginButton } from '../LoginButton'

import classes from './NavBurger.module.css'

export const NavBurger = () => {
  const [showMenu, setShowMenu] = useState(false)

  const navRef = useRef<HTMLElement | null>(null)
  useOutsideClickHandler(navRef, () => {
    setShowMenu(false)
  })
  return (
    <nav ref={navRef} className={classes.NavBurger__nav}>
      <button
        aria-label={showMenu ? 'Show menu' : 'Hide menu'}
        className={cn(
          'element-button button-1 ghost',
          showMenu && 'show',
          classes.NavBurger__button
        )}
        onClick={() => setShowMenu((showMenu) => !showMenu)}
      >
        <div></div>
      </button>
      {showMenu ? (
        <menu className={classes.NavBurger__menu}>
          <Link
            className={cn('heading-2', classes.NavBurger__link)}
            to="/Encounter"
          >
            Encounters
          </Link>

          <Link
            className={cn('heading-2', classes.NavBurger__link)}
            to="/Patient"
          >
            Patients
          </Link>

          <hr />

          <Link
            className={cn('heading-2', classes.NavBurger__link)}
            to="/Composition"
          >
            Compositions
          </Link>

          <Link
            className={cn('heading-2', classes.NavBurger__link)}
            to="/Observation"
          >
            Observations
          </Link>

          <hr />

          <Link
            className={cn('heading-2', classes.NavBurger__link)}
            to="/Questionnaire"
          >
            Questionnaires
          </Link>

          <Link
            className={cn('heading-2', classes.NavBurger__link)}
            to="/QuestionnaireResponse"
          >
            Questionnaire Responses
          </Link>

          <hr />

          <Link
            className={cn('heading-2', classes.NavBurger__link)}
            to="/Practitioner"
          >
            Practitioners
          </Link>

          <LoginButton className={cn('heading-2', classes.NavBurger__link)} />
        </menu>
      ) : undefined}
    </nav>
  )
}
