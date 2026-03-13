import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { cn } from '@assessmentis/react-util'

import { shouldShowRawData } from 'app/util/debugHelpers'

import classes from './ResourceDetailPage.module.css'

interface ResourceDetailSection {
  id: string
  title: ReactNode
  content: ReactNode
  hidden?: boolean
}

interface ResourceDetailPageProps {
  // Navigation
  editTo?: string

  // Header
  title: string | ReactNode
  subtitle?: string | ReactNode

  // Content sections
  sections: ResourceDetailSection[] | { skeleton: ReactNode[] }

  // Debug data
  debugData?: unknown

  // Class overrides
  className?: string
}

export function ResourceDetailPage({
  editTo,
  title,
  subtitle,
  sections,
  debugData,
  className,
}: ResourceDetailPageProps) {
  return (
    <div className={cn(classes.DetailPage, className)}>
      <div className={classes.DetailPage__header}>
        <h1 className={cn('heading-5', classes.DetailPage__title)}>{title}</h1>
        {editTo ? (
          <Link to={editTo} className="element-button button-2 blue filled">
            Edit
          </Link>
        ) : undefined}
      </div>

      {subtitle ? (
        <p className={cn('text-alt-heading-2', classes.DetailPage__subtitle)}>
          {subtitle}
        </p>
      ) : undefined}

      {'skeleton' in sections
        ? sections.skeleton
        : sections.map((section) =>
            !section.hidden ? (
              <section key={section.id} className={classes.DetailPage__section}>
                {typeof section.title == 'string' ? (
                  <h2 className="heading-4">{section.title}</h2>
                ) : (
                  section.title
                )}
                <div className={classes.DetailPage__sectionContent}>
                  {section.content}
                </div>
              </section>
            ) : undefined
          )}

      {shouldShowRawData(debugData) ? (
        <details className={classes.DetailPage__debug}>
          <summary className="heading-4">Raw Data</summary>
          <pre className={classes.DetailPage__debugContent}>
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </details>
      ) : undefined}
    </div>
  )
}
