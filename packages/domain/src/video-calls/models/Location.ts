import { Schema } from "effect";
import { Element } from "../../general-purpose";

export const LocationId = Schema.String.pipe(Schema.brand("LocationId"));
/**
 * Details of a Technology mediated contact point (phone, fax, email, etc.)
 */

export const Location = Schema.Struct({
  ...Element(LocationId).fields,
  identifier: Schema.Struct({
    value: Schema.String,
  }),
});
