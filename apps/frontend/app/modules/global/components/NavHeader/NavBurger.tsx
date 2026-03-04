import { useRef, useState } from 'react'
import { Link } from 'react-router'

import { cn, useOutsideClickHandler } from '@assessmentis/react-util'

import { LoginButton } from '../LoginButton'
import classes from './NavBurger.module.css'

export const NavBurger = () => {
  const [menuShowing, setMenuShowing] = useState(false)

  const navRef = useRef<HTMLElement | null>(null)
  useOutsideClickHandler(navRef, () => {
    setMenuShowing(false)
  })
  return (
    <nav ref={navRef} className={classes.NavBurger__nav}>
      <button
        aria-label={menuShowing ? 'Show menu' : 'Hide menu'}
        className={cn(
          'element-button button-1 ghost',
          menuShowing && 'show',
          classes.NavBurger__button
        )}
        onClick={() => setMenuShowing((showing) => !showing)}
      >
        <div></div>
      </button>
      {menuShowing ? (
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

          <Link
            className={cn('heading-2', classes.NavBurger__link)}
            to="/Location"
          >
            Locations
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
