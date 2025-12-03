import { Schema } from "effect";

export const CompositionId = Schema.UUID.pipe(Schema.brand("CompositionId"));

export type CompositionId = typeof CompositionId.Type;

export const CompositionTemplateId = Schema.UUID.pipe(
  Schema.brand("CompositionTemplateId"),
);

export type CompositionTemplateId = typeof CompositionTemplateId.Type;

export const Composition = Schema.Struct({
  composition_id: CompositionId,
  composition_template_id: CompositionTemplateId,
});

export type Composition = typeof Composition.Type;
