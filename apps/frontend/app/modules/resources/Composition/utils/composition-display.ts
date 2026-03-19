import type { Composition } from '@assessmentis/clinical-domain'

/**
 * Get a display-friendly name for a composition
 */
export function getCompositionDisplayName(composition: Composition): string {
  return composition.title || composition.type.text || 'Untitled Composition'
}

/**
 * Get the composition type text
 */
export function getCompositionType(composition: Composition): string {
  return composition.type.text || composition.type.coding?.[0]?.display || 'Unknown type'
}

/**
 * Format composition details for display in DetailGrid
 */
export function formatCompositionDetails(
  composition: Composition
): { label: string; value: string; hidden?: boolean }[] {
  return [
    {
      label: 'Status',
      value: composition.status.charAt(0).toUpperCase() + composition.status.slice(1),
    },
    {
      label: 'Type',
      value: getCompositionType(composition),
    },
    {
      label: 'Date',
      value: new Date(composition.date.epochMillis).toLocaleString(),
    },
    {
      label: 'Subject',
      value: composition.subject?.display ?? composition.subject?.reference ?? 'Not specified',
    },
    {
      label: 'Authors',
      value:
        composition.author.map((a) => a.display ?? a.reference ?? 'Unknown').join(', ') ||
        'Not specified',
    },
  ]
}
