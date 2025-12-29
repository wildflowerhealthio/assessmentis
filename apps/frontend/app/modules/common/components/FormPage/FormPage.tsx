import { ReactNode } from 'react'
import classes from './FormPage.module.css'

interface FormPageProps {
  title: string
  children: ReactNode
}

export function FormPage({ title, children }: FormPageProps) {
  return (
    <div className={classes.FormPage}>
      <h1 className="heading-5">{title}</h1>
      <div className={classes.FormPage__form}>{children}</div>
    </div>
  )
}
