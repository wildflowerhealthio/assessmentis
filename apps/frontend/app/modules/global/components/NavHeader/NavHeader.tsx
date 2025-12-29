import { Link, useNavigate } from 'react-router'
import classes from './NavHeader.module.css'
import { cn } from '@assessmentis/react-util'
import { useRef, useState } from 'react'
import { useOutsideClickHandler } from '@assessmentis/react-util/hooks'
import { LoginButton } from '../LoginButton'
import { useBreadcrumbContext } from '../../contexts/BreadcrumbContext'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

const NavHeader = () => {
  const [showMenu, setShowMenu] = useState(false)
  const { breadcrumbs } = useBreadcrumbContext()
  const navigate = useNavigate()

  const navRef = useRef<HTMLElement | null>(null)
  useOutsideClickHandler(navRef, () => {
    setShowMenu(false)
  })

  const renderBreadcrumbs = () => {
    // Always include home breadcrumb at the start
    const allBreadcrumbs =
      breadcrumbs.length > 0
        ? [{ label: '𝐴', href: '/' }, ...breadcrumbs]
        : [{ label: '𝐴ssessment.is', href: '/' }]

    return (
      <div
        className={cn('text-alt-heading-3', classes.NavHeader__breadcrumbs)}
        style={{ marginRight: 'var(--space-5)' }}
      >
        {allBreadcrumbs.map((segment, index) => {
          const isLast = index === allBreadcrumbs.length - 1

          return (
            <span key={index} className={classes.NavHeader__breadcrumbSegment}>
              {index > 0 && (
                <span className={classes.NavHeader__breadcrumbSeparator}>
                  {' / '}
                </span>
              )}
              {'loading' in segment && segment.loading ? (
                <Skeleton width={120} />
              ) : segment.href && !isLast ? (
                <Link
                  to={segment.href}
                  className={classes.NavHeader__breadcrumbLink}
                >
                  {segment.label}
                </Link>
              ) : (
                <span className={classes.NavHeader__breadcrumbCurrent}>
                  {segment.label}
                </span>
              )}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <header className={classes.NavHeader}>
      <div className={classes.NavHeader__leftSection}>
        <button
          onClick={() => navigate(-1)}
          className={cn('text-alt-heading-3', classes.NavHeader__backButton)}
          aria-label="Go back"
        >
          ←
        </button>
        {renderBreadcrumbs()}
      </div>
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
