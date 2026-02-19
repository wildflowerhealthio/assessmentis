import type { DeepReadonly } from '@assessmentis/util'

export interface ReadonlyUrl<
  Components extends {
    Protocol?: string
    Host?: string
    Pathname?: string
    Search?: string
    Username?: string
    Password?: string
  } = object,
> {
  /**
   * The protocol portion of the URL.
   */
  readonly protocol: Components['Protocol'] extends undefined
    ? string
    : Components['Protocol']
  /**
   * Gets and sets the host portion of the URL.
   *
   * ```js
   * const myURL = new URL('https://example.org:81/foo');
   * console.log(myURL.host);
   * // Prints example.org:81
   *
   * myURL.host = 'example.com:82';
   * console.log(myURL.href);
   * // Prints https://example.com:82/foo
   * ```
   *
   * Invalid host values assigned to the `host` property are ignored.
   */
  readonly host: Components['Host'] extends undefined
    ? string
    : Components['Host']
  /**
   * Gets and sets the path portion of the URL.
   *
   * ```js
   * const myURL = new URL('https://example.org/abc/xyz?123');
   * console.log(myURL.pathname);
   * // Prints /abc/xyz
   *
   * myURL.pathname = '/abcdef';
   * console.log(myURL.href);
   * // Prints https://example.org/abcdef?123
   * ```
   *
   * Invalid URL characters included in the value assigned to the `pathname` property are `percent-encoded`. The selection of which characters
   * to percent-encode may vary somewhat from what the {@link parse} and {@link format} methods would produce.
   */
  readonly pathname: Components['Pathname'] extends undefined
    ? string
    : Components['Pathname']
  /**
   * The serialized query portion of the URL.
   *
   * Any invalid URL characters appearing in the value assigned the `search` property will be `percent-encoded`. The selection of which
   * characters to percent-encode may vary somewhat from what the {@link parse} and {@link format} methods would produce.
   */
  readonly search: Components['Search'] extends undefined
    ? string
    : Components['Search']
  /**
   * The username portion of the URL.
   *
   * Any invalid URL characters appearing in the value assigned the `username` property will be `percent-encoded`. The selection of which
   * characters to percent-encode may vary somewhat from what the {@link parse} and {@link format} methods would produce.
   */
  readonly username: Components['Username'] extends undefined
    ? string
    : Components['Username']
  /**
   * Gets and sets the password portion of the URL.
   *
   * ```js
   * const myURL = new URL('https://abc:xyz@example.com');
   * console.log(myURL.password);
   * // Prints xyz
   *
   * myURL.password = '123';
   * console.log(myURL.href);
   * // Prints https://abc:123@example.com/
   * ```
   *
   * Invalid URL characters included in the value assigned to the `password` property
   * are `percent-encoded`. The selection of which characters to
   * percent-encode may vary somewhat from what the {@link parse} and {@link format} methods would produce.
   */
  readonly password: Components['Password'] extends undefined
    ? string
    : Components['Password']
}

export const ResourceType: unique symbol = Symbol.for(
  '@assessmentis/effectful-store/Resource/ResourceType'
)
export type ResourceType = typeof ResourceType

export const ResourceUrl: unique symbol = Symbol.for(
  '@assessmentis/effectful-store/Resource/ResourceUrl'
)
export type ResourceUrl = typeof ResourceUrl

/**
 * Base type for resources that can be used in requests
 */
export interface Resource<
  TResourceType extends PropertyKey,
  TResourceUrl extends ReadonlyUrl,
> {
  [ResourceType]: TResourceType
  [ResourceUrl]?: TResourceUrl | undefined
}

export type AnyResource = Resource<PropertyKey, ReadonlyUrl>

export type WithResourceUrl<T extends Resource<PropertyKey, ReadonlyUrl>> =
  T & {
    [ResourceUrl]: NonNullable<T[typeof ResourceUrl]>
  }

export type InferResourceUrl<T extends Resource<PropertyKey, ReadonlyUrl>> =
  NonNullable<T[typeof ResourceUrl]>

// Deprecated
export interface BaseResource {
  readonly resourceType: string
  readonly id?: string | undefined
}

// Deprecated
export type WithId<T extends { readonly id?: string | undefined }> = T & {
  readonly id: NonNullable<T['id']>
}

// Deprecated
export type Id<T extends { id?: unknown }> = NonNullable<T['id']>
