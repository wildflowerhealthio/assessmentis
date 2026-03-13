import { Option, Schema } from 'effect'

export const CredentialId = Schema.String.pipe(Schema.brand('CredentialId'))
export type CredentialId = typeof CredentialId.Type

/**
 * Build a {@link CredentialId} from a tag and a key.
 *
 * Throws if `tag` contains the `:` separator — tags must be simple
 * identifiers so that the first colon unambiguously delimits tag from key.
 */
export const makeCredentialId = (tag: string, key: string): CredentialId => {
  if (tag.includes(':')) {
    throw new Error(
      `Credential tag must not contain ':' separator, got: "${tag}"`
    )
  }
  return CredentialId.make(`${tag}:${key}`)
}

/**
 * Parse a credential ID string into its tag and key components.
 *
 * Returns {@link Option.None} when the string contains no `:` delimiter.
 */
export const parseCredentialId = (
  id: string
): Option.Option<{ tag: string; key: string }> => {
  const colonIndex = id.indexOf(':')
  if (colonIndex === -1) return Option.none()
  return Option.some({
    tag: id.substring(0, colonIndex),
    key: id.substring(colonIndex + 1),
  })
}
