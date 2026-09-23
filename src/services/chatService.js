const BACKEND_URL = import.meta.env.VITE_TEXT_SESSION_URL || ''
const CONVERSATIONS_PATH = '/api/v1/public/conversations'
const ORGANISATION_ID = import.meta.env.VITE_ORGANISATION_ID || ''
const BORNE_ID = import.meta.env.VITE_BORNE_ID || ''

function buildUrl(path) {
  // trim() protège contre une espace accidentelle dans le .env.
  const baseUrl = BACKEND_URL.trim().replace(/\/$/, '')
  return `${baseUrl}${path}`
}

/** Lit la réponse en texte puis tente de la parser en JSON. */
async function readBody(response) {
  const rawBody = await response.text()
  if (!rawBody) return null
  try {
    return JSON.parse(rawBody)
  } catch {
    // Les réponses en texte brut restent acceptées.
    return rawBody
  }
}

function assertOk(response, body) {
  if (response.ok) return
  const message = typeof body === 'object' && body?.message
    ? body.message 
    : `Le serveur conversationnel a répondu avec le statut ${response.status}.`
  throw new Error(message)
}

/** Récupère l'identifiant de conversation renvoyé par le backend. */
function extractConversationId(payload) {
  if (!payload || typeof payload !== 'object') return ''
  return payload.conversationId ?? payload.id ?? ''
}

/** Extrait le texte à afficher, que le backend renvoie un message ou une liste. */
function extractAnswer(payload) {
  if (!payload) return ''
  if (typeof payload === 'string') return payload

  const messages = Array.isArray(payload) ? payload : payload.messages
  if (Array.isArray(messages)) {
    // Le dernier message qui n'est pas celui de l'utilisateur est la réponse du bot.
    const answer = [...messages].reverse().find((message) => message?.content && message?.role !== 'user')
    return answer?.content ?? ''
  }

  return payload.content ?? payload.answer ?? payload.response ?? payload.message ?? ''
}

async function fetchLastMessage(conversationId, signal) {
  const response = await fetch(buildUrl(`${CONVERSATIONS_PATH}/${encodeURIComponent(conversationId)}/messages`), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  })
  const body = await readBody(response)
  assertOk(response, body)
  return extractAnswer(body)
}

/** Crée une conversation côté backend : c'est lui qui génère l'identifiant. */
async function createConversation({ content, language, signal }) {
  const response = await fetch(buildUrl(CONVERSATIONS_PATH), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: content,
      language,
      // Champs optionnels : envoyés seulement s'ils sont configurés.
      ...(ORGANISATION_ID ? { organisationId: ORGANISATION_ID } : {}),
      ...(BORNE_ID ? { borneId: BORNE_ID } : {}),
    }),
    signal,
  })
  const body = await readBody(response)
  assertOk(response, body)
  return body
}

/** Découpe un bloc SSE (`event:` / `data:`) en objet exploitable. */
function parseSseBlock(block) {
  let event = 'message'
  const dataLines = []

  for (const line of block.split('\n')) {
    if (line.startsWith(':')) continue // commentaire / keep-alive
    const separator = line.indexOf(':')
    if (separator === -1) continue
    const field = line.slice(0, separator)
    const value = line.slice(separator + 1).trimStart()
    if (field === 'event') event = value
    else if (field === 'data') dataLines.push(value)
  }

  if (!dataLines.length) return null
  const raw = dataLines.join('\n')
  try {
    return { event, data: JSON.parse(raw) }
  } catch {
    // Le backend peut aussi envoyer du texte brut dans data:.
    return { event, data: raw }
  }
}

/** Texte porté par un événement SSE : `delta` en flux, sinon les alias connus. */
function extractDelta(data) {
  if (typeof data === 'string') return data === '[DONE]' ? '' : data
  if (!data || typeof data !== 'object') return ''
  return data.delta ?? data.content ?? data.text ?? ''
}

/**
 * Lit le flux SSE et remonte la réponse au fur et à mesure.
 * Retourne le texte complet et les métadonnées de l'événement `done`.
 */
async function readSseStream(response, { onChunk, isCancelled }) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let answer = ''
  let meta = null

  while (true) {
    const { done, value } = await reader.read()
    if (done || isCancelled()) break

    buffer += decoder.decode(value, { stream: true })
    // Les événements sont séparés par une ligne vide.
    const blocks = buffer.split(/\r?\n\r?\n/)
    buffer = blocks.pop() ?? ''

    for (const block of blocks) {
      const parsed = parseSseBlock(block)
      if (!parsed) continue
      if (parsed.event === 'done') {
        meta = parsed.data
        continue
      }
      if (parsed.event === 'error') {
        throw new Error(parsed.data?.message || 'Le moteur conversationnel a renvoyé une erreur.')
      }
      const delta = extractDelta(parsed.data)
      if (delta) {
        answer += delta
        onChunk?.(answer)
      }
    }
  }

  return { answer, meta }
}

/** Envoie le message et lit la réponse, en flux SSE ou en JSON selon le backend. */
async function postMessage({ conversationId, content, language, tts, signal, onChunk, isCancelled }) {
  const response = await fetch(buildUrl(`${CONVERSATIONS_PATH}/${encodeURIComponent(conversationId)}/messages`), {
    method: 'POST',
    headers: { Accept: 'text/event-stream, application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, tts, language }),
    signal,
  })

  const contentType = response.headers.get('Content-Type') || ''
  if (!response.ok || !contentType.includes('text/event-stream') || !response.body) {
    const body = await readBody(response)
    assertOk(response, body)
    return { answer: extractAnswer(body), meta: null }
  }

  return readSseStream(response, { onChunk, isCancelled })
}

/**
 * Envoie une question au backend.
 * Sans `conversationId`, une nouvelle conversation est créée par le backend
 * et son identifiant est remonté via `onConversationId`.
 */
export function sendChatMessage({
  conversationId,
  content,
  language = 'fr',
  tts = false,
  onConversationId,
  onResponse,
  onError,
  onComplete,
}) {
  const controller = new AbortController()
  let cancelled = false

  const send = async () => {
    try {
      const signal = controller.signal
      let currentId = conversationId

      // La création ne renvoie que la conversation : la réponse vient du message.
      if (!currentId) {
        const conversation = await createConversation({ content, language, signal })
        currentId = extractConversationId(conversation)
        if (!currentId) throw new Error("Le backend n'a pas renvoyé d'identifiant de conversation.")
        if (!cancelled) onConversationId?.(currentId)
      }

      let { answer, meta } = await postMessage({
        conversationId: currentId,
        content,
        language,
        tts,
        signal,
        onChunk: (partial) => {
          if (!cancelled) onResponse?.(partial)
        },
        isCancelled: () => cancelled,
      })

      // Filet de sécurité si le flux n'a rien renvoyé d'exploitable.
      if (!answer && !cancelled) {
        answer = await fetchLastMessage(currentId, signal)
      }

      if (!cancelled) {
        onResponse?.(answer)
        onComplete?.(meta)
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
