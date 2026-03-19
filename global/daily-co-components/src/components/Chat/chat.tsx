import { useCallback, useState } from 'react'
import type { SyntheticEvent } from 'react'

import { useAppMessage, useLocalSessionId, useParticipantProperty } from '@daily-co/daily-react'

import { Arrow } from '../Tray/Icons/index'

import './Chat.css'

import type { DailyEventObjectAppMessage } from '@daily-co/daily-js'

/** A single chat message with the sender's display name. */
interface Message {
  msg: string
  name: string
}

/**
 * In-call text chat panel. Message history is held in local state.
 * Always rendered (never unmounted) so history survives toggling the
 * panel open and closed.
 *
 * @remarks
 * Uses `useAppMessage` from `@daily-co/daily-react` both to send
 * (`sendAppMessage`) and receive (`onAppMessage`) messages. Outgoing
 * messages are appended locally because Daily does not echo them back
 * to the sender.
 */
export default function Chat({
  showChat,
  toggleChat,
}: {
  showChat: boolean
  toggleChat: () => void
}): React.JSX.Element | null {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const localSessionId = useLocalSessionId()
  const username = useParticipantProperty(localSessionId, 'user_name')

  const sendAppMessage = useAppMessage({
    onAppMessage: useCallback((ev: DailyEventObjectAppMessage<Message>) => {
      setMessages((existingMessages) => [
        ...existingMessages,
        {
          msg: ev.data.msg,
          name: ev.data.name,
        },
      ])
    }, []),
  })

  const sendMessage = useCallback(
    (message: string) => {
      /* Send the message to all participants in the chat - this does not include ourselves!
       * See https://docs.daily.co/reference/daily-js/events/participant-events#app-message
       */
      sendAppMessage(
        {
          msg: message,
          name: username || 'Guest',
        },
        '*'
      )

      /* Since we don't receive our own messages, we will set our message in the messages array.
       * This way _we_ can also see what we wrote.
       */
      setMessages([
        ...messages,
        {
          msg: message,
          name: username || 'Guest',
        },
      ])
    },
    [messages, sendAppMessage, username]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value)
  }

  const handleSubmit = (e: SyntheticEvent): void => {
    e.preventDefault()
    // Don't allow people to submit empty strings
    if (!inputValue.trim()) {
      return
    }
    sendMessage(inputValue)
    setInputValue('')
  }

  return showChat ? (
    <aside className="chat">
      <button onClick={toggleChat} className="close-chat" type="button">
        Close chat
      </button>
      <ul className="chat-messages">
        {messages.map((message, index) => (
          <li key={`message-${index}`} className="chat-message">
            <span className="chat-message-author">{message?.name}</span>:{' '}
            <p className="chat-message-body">{message?.msg}</p>
          </li>
        ))}
      </ul>
      <div className="add-message">
        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            className="chat-input"
            type="text"
            placeholder="Type your message here.."
            value={inputValue}
            onChange={handleChange}
          />
          <button type="submit" className="chat-submit-button">
            <Arrow />
          </button>
        </form>
      </div>
    </aside>
  ) : null
}
