import { ReactNode } from 'react'

interface FormPageProps {
  title: string
  children: ReactNode
}

export function FormPage({ title, children }: FormPageProps) {
  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <h1 className="heading-1">{title}</h1>
      <div style={{ marginTop: 'var(--space-4)', maxWidth: '600px' }}>
        {children}
      </div>
    </div>
  )
}
