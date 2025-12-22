import { CompositionSection } from '@assessmentis/clinical-domain/content-management'
import { Effect } from 'effect'
import React from 'react'

export interface JsxCompositionSection {
  jsx: React.JSX.Element
  compositionSection: CompositionSection
}

export type JsxCompositionSectionComponent<P extends object> = (
  props: P
) => JsxCompositionSection

export type JsxCompositionSectionContainer<
  P extends object = object,
  Err = never,
  Context = never,
> = (
  props: P & { children?: JsxCompositionSection[] | undefined }
) => Effect.Effect<JsxCompositionSection, Err, Context>
