import {
  Composition,
  CompositionSection,
} from '@assessmentis/clinical-domain/content-management'
import { Schema } from 'effect'

export const IntermediateComposition = <Out>(
  outSchema: Schema.Schema<Out, string>
) => Schema.extend(Schema.Struct({ out: outSchema }), Composition)

export type IntermediateComposition<Out> = ReturnType<
  typeof IntermediateComposition<Out>
>['Type']

export const IntermediateCompositionSection = <Out>(
  outSchema: Schema.Schema<Out, string>
) => Schema.extend(Schema.Struct({ out: outSchema }), CompositionSection)

export type IntermediateCompositionSection<Out> = ReturnType<
  typeof IntermediateCompositionSection<Out>
>['Type']
