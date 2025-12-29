import { ReactNode } from 'react'
import { cn } from '@assessmentis/react-util'
import classes from './ResourceEditPage.module.css'

interface ResourceEditPageProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}

export function ResourceEditPage({
  title,
  subtitle,
  children,
  className,
}: ResourceEditPageProps) {
  return (
    <div className={cn(classes.EditPage, className)}>
      <h1 className="heading-5">{title}</h1>
      {subtitle ? (
        <p className={cn('text-alt-heading-2', classes.EditPage__subtitle)}>
          {subtitle}
        </p>
      ) : undefined}
      <div className={classes.EditPage__form}>{children}</div>
    </div>
  )
}
