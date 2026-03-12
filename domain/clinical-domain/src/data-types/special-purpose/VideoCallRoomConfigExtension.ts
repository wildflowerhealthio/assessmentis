import type { DateTime } from 'effect'

import { Extension } from './Extension'

/**
 * Extension URL for video call room configuration.
 */
export const VIDEO_CALL_ROOM_CONFIG_URL =
  'http://assessment.is/fhir/video-call-room-config' as const

const SUB_EXTENSION_URLS = {
  expiresAt: 'http://assessment.is/fhir/video-call-room-config#expires-at',
  enableRecording:
    'http://assessment.is/fhir/video-call-room-config#enable-recording',
  enableChat: 'http://assessment.is/fhir/video-call-room-config#enable-chat',
} as const

export interface VideoCallRoomConfig {
  readonly expiresAt?: DateTime.Utc
  readonly enableRecording?: boolean
  readonly enableChat?: boolean
}

/**
 * Build a nested FHIR Extension representing video call room configuration.
 */
export const makeVideoCallRoomConfigExtension = (
  config: VideoCallRoomConfig
): Extension => {
  const subExtensions: Extension[] = []

  if (config.expiresAt !== undefined) {
    subExtensions.push(
      Extension.make({
        definitionUrl: SUB_EXTENSION_URLS.expiresAt,
        value: { _tag: 'dateTime', dateTime: config.expiresAt } as const,
      })
    )
  }

  if (config.enableRecording !== undefined) {
    subExtensions.push(
      Extension.make({
        definitionUrl: SUB_EXTENSION_URLS.enableRecording,
        value: { _tag: 'boolean', boolean: config.enableRecording },
      })
    )
  }

  if (config.enableChat !== undefined) {
    subExtensions.push(
      Extension.make({
        definitionUrl: SUB_EXTENSION_URLS.enableChat,
        value: { _tag: 'boolean', boolean: config.enableChat },
      })
    )
  }

  return Extension.make({
    definitionUrl: VIDEO_CALL_ROOM_CONFIG_URL,
    extension: subExtensions,
  })
}

/**
 * Parse a VideoCallRoomConfig from a FHIR Extension, if it matches the
 * expected definition URL.
 */
export const parseVideoCallRoomConfigExtension = (
  ext: Extension
): VideoCallRoomConfig | undefined => {
  if (ext.definitionUrl !== VIDEO_CALL_ROOM_CONFIG_URL) return undefined

  const config: {
    expiresAt?: DateTime.Utc
    enableRecording?: boolean
    enableChat?: boolean
  } = {}

  for (const sub of ext.extension) {
    switch (sub.definitionUrl) {
      case SUB_EXTENSION_URLS.expiresAt:
        if (sub.value?._tag === 'dateTime') {
          config.expiresAt = sub.value.dateTime
        }
        break
      case SUB_EXTENSION_URLS.enableRecording:
        if (sub.value?._tag === 'boolean') {
          config.enableRecording = sub.value.boolean
        }
        break
      case SUB_EXTENSION_URLS.enableChat:
        if (sub.value?._tag === 'boolean') {
          config.enableChat = sub.value.boolean
        }
        break
    }
  }

  return config
}

/**
 * Find and parse a VideoCallRoomConfig from an array of Extensions.
 */
export const findVideoCallRoomConfig = (
  extensions: ReadonlyArray<Extension> | undefined
): VideoCallRoomConfig | undefined => {
  if (!extensions) return undefined
  for (const ext of extensions) {
    const config = parseVideoCallRoomConfigExtension(ext)
    if (config) return config
  }
  return undefined
}
