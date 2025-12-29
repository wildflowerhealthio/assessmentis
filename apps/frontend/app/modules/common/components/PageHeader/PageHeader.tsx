import classes from './PageHeader.module.css'

interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <>
      <h1 className="heading-5">{title}</h1>
      {subtitle ? (
        <div className={classes.PageHeader__subtitle}>{subtitle}</div>
      ) : undefined}
    </>
  )
}
