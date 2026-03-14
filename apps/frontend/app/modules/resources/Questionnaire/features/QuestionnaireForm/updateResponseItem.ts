import type { SetStateAction } from 'react'

import {
  QuestionnaireResponseItem,
  type QuestionnaireItemLink,
} from '@assessmentis/clinical-domain'

/**
 * Creates a state updater that replaces or inserts a child
 * {@link QuestionnaireResponseItem} by `linkId` using the domain model's
 * {@link QuestionnaireResponseItem.withChildItem} (or {@link QuestionnaireResponse.withChildItem}).
 */
export const updateResponseItem =
  (
    linkId: typeof QuestionnaireItemLink.Type,
    update: SetStateAction<QuestionnaireResponseItem>
  ) =>
  <
    T extends {
      withChildItem(
        linkId: typeof QuestionnaireItemLink.Type,
        updater: (prev: QuestionnaireResponseItem) => QuestionnaireResponseItem
      ): T
    },
  >(
    parent: T
  ): T =>
    parent.withChildItem(linkId, (existing) =>
      typeof update === 'function'
        ? QuestionnaireResponseItem.make(update(existing))
        : QuestionnaireResponseItem.make(update)
    )
