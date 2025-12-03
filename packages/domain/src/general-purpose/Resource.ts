import { Schema } from "effect";
import { Code } from "./Coding";
import { Meta } from "./DomainResource";

export const Resource = <IdType extends string>(
  idSchema: Schema.Schema<IdType, string>,
) =>
  Schema.Struct({
    /**
     * Logical id of this artifact
     */
    id: Schema.optional(idSchema),
    /**
     * Metadata about the resource
     */
    meta: Schema.optional(Meta),
    /**
     * Metadata about the resource
     */
    implicitRules: Schema.optional(Schema.URL),
    /**
     * Metadata about the resource
     */
    language: Schema.optional(Code),
  });
