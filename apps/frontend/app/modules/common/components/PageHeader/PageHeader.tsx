interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <>
      <h1 className="heading-1">{title}</h1>
      {subtitle && (
        <div
          className="subheading-3"
          style={{
            color: 'var(--color-text-secondary)',
            marginTop: 'var(--space-2)',
          }}
        >
          {subtitle}
        </div>
      )}
    </>
  )
}
