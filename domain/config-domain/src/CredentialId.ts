import { Schema } from 'effect'

export const CredentialId = Schema.String.pipe(Schema.brand('CredentialId'))
export type CredentialId = typeof CredentialId.Type
