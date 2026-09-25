import { kioskConfig } from '../lib/kiosk'

const BACKEND_URL = import.meta.env.VITE_TEXT_SESSION_URL || ''
const CONVERSATIONS_PATH = '/api/v1/public/conversations'
// Une borne peut préciser son organisation et son identifiant dans son adresse (voir lib/kiosk.js).
const ORGANISATION_ID = kioskConfig?.organizationId || import.meta.env.VITE_ORGANISATION_ID || ''
const BORNE_ID = kioskConfig?.borneId || import.meta.env.VITE_BORNE_ID || ''

// Première phrase envoyée quand une conversation démarre à l'oral sans organisation configurée :
// l'API exige soit `organizationId`, soit une `question` pour router vers la bonne structure.
const VOICE_OPENERS = { fr: 'Bonjour', wo: 'Salaamaalekum' }

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
  const error = new Error(typeof body === 'object' && body?.message ? body.message : defaultErrorMessage(response.status))
  error.status = response.status
  throw error
}

// Messages affichés quand le serveur ne fournit pas d'explication : chacun indique quoi faire ensuite.
function defaultErrorMessage(status) {
  if (status === 429) return 'Trop de demandes en peu de temps. Patientez une minute puis réessayez.'
  if (status === 404) return 'Cette conversation est introuvable. Commencez une nouvelle discussion.'
  if (status >= 500) return 'Le service est momentanément indisponible. Réessayez dans quelques instants.'
  return `Le serveur a refusé la demande (statut ${status}). Reformulez votre question ou réessayez.`
}

/** fetch() qui transforme une coupure réseau en message compréhensible par l'usager. */
async function request(url, init) {
  try {
    return await fetch(url, init)
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion internet puis réessayez.')
  }
}

/** Récupère l'identifiant de conversation renvoyé par le backend. */
function extractConversationId(payload) {
  if (!payload || typeof payload !== 'object') return ''
  return payload.conversationId ?? payload.id ?? ''
}

const isUserRole = (role) => String(role).toLowerCase() === 'user'

/** Extrait le texte à afficher, que le backend renvoie un message ou une liste. */
function extractAnswer(payload) {
  if (!payload) return ''
  if (typeof payload === 'string') return payload

  const messages = Array.isArray(payload) ? payload : payload.messages
  if (Array.isArray(messages)) {
    // Le dernier message qui n'est pas celui de l'utilisateur est la réponse du bot.
    const answer = [...messages].reverse().find((message) => message?.content && !isUserRole(message?.role))
    return answer?.content ?? ''
  }

  return payload.content ?? payload.answer ?? payload.response ?? payload.message ?? ''
}

/** Historique complet d'une conversation (ordre chronologique). */
export async function fetchMessages(conversationId, signal) {
  const response = await request(buildUrl(`${CONVERSATIONS_PATH}/${encodeURIComponent(conversationId)}/messages`), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  })
  const body = await readBody(response)
  assertOk(response, body)
  return Array.isArray(body) ? body : body?.messages ?? []
}

/** Dernière question de l'usager : c'est ainsi qu'on récupère la transcription d'une question vocale. */
export function lastUserContent(messages) {
  return [...messages].reverse().find((message) => isUserRole(message?.role))?.content ?? ''
}

/**
 * Crée une conversation côté backend : c'est lui qui génère l'identifiant.
 * L'API attend exactement l'un des deux : `organizationId` (borne configurée) ou `question`.
 */
async function createConversation({ question, language, signal }) {
  const target = ORGANISATION_ID
    ? { organizationId: ORGANISATION_ID, ...(BORNE_ID ? { borneId: BORNE_ID } : {}) }
    : { question }

  const response = await request(buildUrl(CONVERSATIONS_PATH), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...target, language }),
    signal,
  })
  const body = await readBody(response)
  assertOk(response, body)

  const id = extractConversationId(body)
  if (id) return id
  // Plusieurs structures possibles : le backend demande à l'usager de préciser sa demande.
  if (Array.isArray(body?.candidates) && body.candidates.length) {
    const names = body.candidates.slice(0, 3).map((candidate) => candidate.name).filter(Boolean).join(', ')
    throw new Error(`Plusieurs structures peuvent vous répondre${names ? ` (${names})` : ''}. Précisez le service ou la structure concernée dans votre question.`)
  }
  throw new Error("Le backend n'a pas renvoyé d'identifiant de conversation.")
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
 * Lit le flux SSE de réponse. Événements documentés : `message` ({delta}),
 * `audio-chunk` ({audioUrl, index, total}), `language-alert`, `error` et `done` (dernier).
 * Retourne le texte complet et les métadonnées de l'événement `done`.
 */
async function readSseStream(response, { onChunk, onAudioChunk, onLanguageAlert, isCancelled }) {
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
      switch (parsed.event) {
        case 'done':
          meta = parsed.data
          break
        case 'error':
          throw new Error(parsed.data?.message || 'Le moteur conversationnel a renvoyé une erreur.')
        case 'audio-chunk':
          onAudioChunk?.(parsed.data)
          break
        case 'language-alert':
          onLanguageAlert?.(parsed.data)
          break
        default: {
          const delta = extractDelta(parsed.data)
          if (delta) {
            answer += delta
            onChunk?.(answer)
          }
        }
      }
    }
  }

  return { answer, meta }
}

/** Lit la réponse d'un POST de message : flux SSE, ou JSON si le backend ne streame pas. */
async function readMessageResponse(response, handlers) {
  const contentType = response.headers.get('Content-Type') || ''
  if (!response.ok || !contentType.includes('text/event-stream') || !response.body) {
    const body = await readBody(response)
    assertOk(response, body)
    return { answer: extractAnswer(body), meta: null }
  }
  return readSseStream(response, handlers)
}

/** Envoie le message et lit la réponse, en flux SSE ou en JSON selon le backend. */
async function postMessage({ conversationId, content, tts, signal, ...handlers }) {
  const response = await request(buildUrl(`${CONVERSATIONS_PATH}/${encodeURIComponent(conversationId)}/messages`), {
    method: 'POST',
    headers: { Accept: 'text/event-stream, application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, tts }),
    signal,
  })
  return readMessageResponse(response, handlers)
}

/** Envoie un enregistrement audio (multipart) ; `lang` choisit le moteur de transcription (wo | fr). */
async function postAudio({ conversationId, file, filename, lang, tts, signal, ...handlers }) {
  const form = new FormData()
  form.append('file', file, filename)
  const query = new URLSearchParams({ lang, tts: String(tts) })

  const response = await request(buildUrl(`${CONVERSATIONS_PATH}/${encodeURIComponent(conversationId)}/messages/audio?${query}`), {
    method: 'POST',
    // Pas de Content-Type manuel : le navigateur ajoute la frontière du multipart.
    headers: { Accept: 'text/event-stream, application/json' },
    body: form,
    signal,
  })
  return readMessageResponse(response, handlers)
}

/**
 * URL lisible d'un morceau de synthèse vocale. Le backend peut renvoyer une URL complète,
 * un chemin absolu ou un simple nom de fichier servi par GET /conversations/audio/{filename}.
 */
export function resolveAudioUrl(audioUrl) {
  if (!audioUrl) return ''
  if (/^https?:\/\//i.test(audioUrl)) return audioUrl
  if (audioUrl.startsWith('/')) return buildUrl(audioUrl)
  return buildUrl(`${CONVERSATIONS_PATH}/audio/${encodeURIComponent(audioUrl)}`)
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
        currentId = await createConversation({ question: content, language, signal })
        if (!cancelled) onConversationId?.(currentId)
      }

      let { answer, meta } = await postMessage({
        conversationId: currentId,
        content,
        tts,
        signal,
        onChunk: (partial) => {
          if (!cancelled) onResponse?.(partial)
        },
        isCancelled: () => cancelled,
      })

      // Filet de sécurité si le flux n'a rien renvoyé d'exploitable.
      if (!answer && !cancelled) {
        answer = extractAnswer(await fetchMessages(currentId, signal))
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

/**
 * Envoie une question vocale et suit la réponse SSE (texte + morceaux audio).
 * Crée la conversation au besoin. Retourne une fonction d'annulation.
 */
export function sendVoiceMessage({
  conversationId,
  file,
  filename,
  lang = 'wo',
  tts = true,
  onConversationId,
  onResponse,
  onAudioChunk,
  onLanguageAlert,
  onError,
  onComplete,
}) {
  const controller = new AbortController()
  let cancelled = false
  const guard = (callback) => (...args) => {
    if (!cancelled) callback?.(...args)
  }

  const send = async () => {
    try {
      const signal = controller.signal
      let currentId = conversationId

      if (!currentId) {
        currentId = await createConversation({ question: VOICE_OPENERS[lang] ?? VOICE_OPENERS.fr, language: lang, signal })
        guard(onConversationId)(currentId)
      }

      const { answer, meta } = await postAudio({
        conversationId: currentId,
        file,
        filename,
        lang,
        tts,
        signal,
        onChunk: guard(onResponse),
        onAudioChunk: guard(onAudioChunk),
        onLanguageAlert: guard(onLanguageAlert),
        isCancelled: () => cancelled,
      })

      guard(onResponse)(answer)
      guard(onComplete)({ meta, conversationId: currentId })
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
