import type {
  Composition,
  CompositionSection,
} from '@assessmentis/clinical-domain'

import classes from './CompositionSections.module.css'

interface CompositionSectionsProps {
  composition: Composition
}

function SectionDisplay({
  section,
  depth = 0,
}: {
  section: CompositionSection
  depth?: number
}) {
  return (
    <div
      className={classes.Section}
      style={{ '--section-depth': depth } as React.CSSProperties}
    >
      {section.title ? (
        <h5 className={classes.Section__title}>{section.title}</h5>
      ) : undefined}
      {section.code ? (
        <div className={classes.Section__detail}>
          Code:{' '}
          {section.code.text ?? section.code.coding?.[0]?.display ?? 'Unknown'}
        </div>
      ) : undefined}
      {section.text?.div ? (
        <div
          className={classes.Section__text}
          dangerouslySetInnerHTML={{ __html: section.text.div }}
        />
      ) : undefined}
      {section.entry && section.entry.length > 0 ? (
        <div className={classes.Section__detail}>
          Entries: {section.entry.length} reference(s)
        </div>
      ) : undefined}
      {section.section && section.section.length > 0 ? (
        <div className={classes.Section__subsections}>
          {section.section.map((subsection, i: number) => (
            <SectionDisplay key={i} section={subsection} depth={depth + 1} />
          ))}
        </div>
      ) : undefined}
    </div>
  )
}

export function CompositionSections({ composition }: CompositionSectionsProps) {
  if (!composition.section || composition.section.length === 0) {
    return null
  }

  return (
    <div className={classes.Sections}>
      {composition.section.map((section, i) => (
        <SectionDisplay key={i} section={section} />
      ))}
    </div>
  )
}
