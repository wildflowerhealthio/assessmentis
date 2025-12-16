import { DiagnosticReportTemplate } from '@assessmentis/clinical-domain/diagnostic-reports'

interface DiagnosticReportTemplatesListProps {
  templates: DiagnosticReportTemplate[]
  onSelectTemplate?: (template: DiagnosticReportTemplate) => void
}

export default function DiagnosticReportTemplatesList({
  templates,
  onSelectTemplate,
}: DiagnosticReportTemplatesListProps) {
  return (
    <div className="container" style={{ padding: 'var(--space-4)' }}>
      <h2 className="heading-2">Diagnostic Report Templates</h2>
      <div
        className="grid"
        style={{
          gap: 'var(--space-4)',
          marginTop: 'var(--space-4)',
        }}
      >
        {templates.length === 0 ? (
          <p className="text-muted">No templates available</p>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="card"
              style={{
                padding: 'var(--space-4)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-2)',
              }}
            >
              <h3 className="heading-3">{template.name || 'Untitled Template'}</h3>
              {template.description && (
                <p
                  className="text-muted"
                  style={{ marginTop: 'var(--space-2)' }}
                >
                  {template.description}
                </p>
              )}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  marginTop: 'var(--space-3)',
                  alignItems: 'center',
                }}
              >
                <span
                  className={`badge ${
                    template.status === 'active'
                      ? 'badge-success'
                      : template.status === 'draft'
                        ? 'badge-warning'
                        : 'badge-muted'
                  }`}
                >
                  {template.status}
                </span>
                {template.questionnaireReference && (
                  <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                    For questionnaire: {template.questionnaireReference}
                  </span>
                )}
              </div>
              {onSelectTemplate && (
                <button
                  className="button-1 filled"
                  style={{ marginTop: 'var(--space-3)' }}
                  onClick={() => onSelectTemplate(template)}
                >
                  Use Template
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
