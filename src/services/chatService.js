 const BACKEND_URL = import.meta.env.VITE_TEXT_SESSION_URL || ''
const MESSAGE_PATH = '/api/v1/public/conversations'

function getMessagesUrl(conversationId) {
  const baseUrl = BACKEND_URL.replace(/\/$/, '')
  return `${baseUrl}${MESSAGE_PATH}/${encodeURIComponent(conversationId)}/messages`
}

/** Sends one message to the backend conversation API. */
export function sendChatMessage({ conversationId, content, language = 'fr', tts = true, onResponse, onError, onComplete }) {
  const controller = new AbortController()
  let cancelled = false

  const send = async () => {
    try {
      const response = await fetch(getMessagesUrl(conversationId), {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, tts, language }),
        signal: controller.signal,
      })

      const rawBody = await response.text()
      let body = rawBody
      try {
        body = rawBody ? JSON.parse(rawBody) : null
      } catch {
        // Plain-text responses are also accepted for simple backend implementations.
      }

      if (!response.ok) {
        const message = typeof body === 'object' && body?.message
          ? body.message
          : `Le serveur conversationnel a répondu avec le statut ${response.status}.`
        throw new Error(message)
      }

      if (!cancelled) {
        const answer = typeof body === 'string'
          ? body
          : body?.content ?? body?.message ?? body?.response ?? body?.answer ?? ''
        onResponse?.(answer)
        onComplete?.()
      }
    } catch (error) {
      if (!cancelled && error.name !== 'AbortError') onError?.(error)
    }
  }

  send()
  return () => {
    cancelled = true
    controller.abort()
  }
}

export function createConversationId() {
  return crypto.randomUUID()
}
