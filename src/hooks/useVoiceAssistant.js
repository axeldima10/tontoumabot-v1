import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createVoiceActivityDetector } from '../lib/vad'
import { fetchMessages, lastUserContent, resolveAudioUrl, sendVoiceMessage } from '../services/chatService'

// Formats acceptés par l'API : WAV / MP3 / M4A / WebM. Chrome et Firefox → WebM, Safari → MP4 (m4a).
const RECORDER_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
const MIN_RECORDING_BYTES = 1500

function pickRecorderType() {
  return RECORDER_TYPES.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) ?? ''
}

function extensionFor(mimeType) {
  return mimeType.includes('mp4') ? 'm4a' : 'webm'
}

/**
 * Assistant vocal façon Siri / Alexa : l'usager lance la conversation en touchant le micro, puis elle s'enchaîne seule.
 * appui → écoute → détection de fin de phrase (VAD) → envoi HTTP → réponse SSE (texte + audio) → nouvelle écoute.
 * Elle s'arrête quand l'usager touche « Annuler » ou ne dit plus rien.
 *
 * Phases : idle | starting | listening | thinking | speaking | unavailable
 */
function useVoiceAssistant({ lang, chat, handsFree = true }) {
  const [phase, setPhase] = useState('idle')
  const [heard, setHeard] = useState(false)
  const [answer, setAnswer] = useState('')
  const [notice, setNotice] = useState('')
  const [languageAlert, setLanguageAlert] = useState(null)
  // Réponse vocale illisible (aucun audio reçu ou lecture impossible) : la vue affiche alors le texte en secours.
  const [audioFailed, setAudioFailed] = useState(false)
  // Analyseur affiché par la sphère : micro pendant l'écoute, voix de Tontouma pendant la réponse.
  const analyserRef = useRef(null)
  // Une session par montage : protège des doubles montages de StrictMode et des callbacks tardifs.
  const sessionRef = useRef(null)
  const chatRef = useRef(chat)
  const handsFreeRef = useRef(handsFree)

  useLayoutEffect(() => {
    chatRef.current = chat
    handsFreeRef.current = handsFree
  })

  async function setup(s) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    // Hors HTTPS (ex. http://192.168.x.x), le navigateur masque le micro : on le dit clairement.
    if (!window.isSecureContext) {
      setPhase('unavailable')
      setNotice('Le micro nécessite une connexion sécurisée (HTTPS). Ouvrez l’application en https:// pour parler, ou poursuivez par écrit.')
      return false
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder || !AudioContextClass) {
      setPhase('unavailable')
      setNotice('La capture audio n’est pas disponible dans ce navigateur. Vous pouvez poursuivre par écrit.')
      return false
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      if (s.disposed) {
        stream.getTracks().forEach((track) => track.stop())
        return false
      }
      s.stream = stream
      s.ctx = new AudioContextClass()
      s.micAnalyser = s.ctx.createAnalyser()
      s.micAnalyser.fftSize = 1024
      s.ctx.createMediaStreamSource(stream).connect(s.micAnalyser)
      s.outAnalyser = s.ctx.createAnalyser()
      s.outAnalyser.fftSize = 1024
      s.outAnalyser.connect(s.ctx.destination)
      return true
    } catch (error) {
      setPhase('unavailable')
      setNotice(error.name === 'NotAllowedError'
        ? 'L’accès au microphone a été refusé. Autorisez-le dans les réglages du navigateur, ou poursuivez par écrit.'
        : 'Impossible d’ouvrir le microphone. Vérifiez qu’il est branché, ou poursuivez par écrit.')
      return false
    }
  }

  async function startListening() {
    const s = sessionRef.current
    if (!s || s.disposed) return
    // Interrompre Tontouma pour reparler annule la réponse en cours.
    cancelTurn(s)
    stopPlayback(s)
    if (!s.stream) {
      // Premier appui : le navigateur demande l'autorisation du micro.
      setPhase('starting')
      if (!(await setup(s))) return
    }
    if (s.disposed) return

    if (s.ctx.state === 'suspended') {
      try { await s.ctx.resume() } catch { /* nécessite un geste de l'usager */ }
    }
    if (s.ctx.state !== 'running') {
      // Le navigateur exige un appui avant d'activer l'audio : on attend le geste.
      setPhase('idle')
      setNotice('Touchez le micro pour commencer à parler.')
      return
    }

    const type = pickRecorderType()
    const recorder = new MediaRecorder(s.stream, type ? { mimeType: type } : undefined)
    const parts = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) parts.push(event.data)
    }
    recorder.onstop = () => {
      if (!s.sendOnStop || s.disposed) return
      const mimeType = recorder.mimeType || type || 'audio/webm'
      sendRecording(s, new Blob(parts, { type: mimeType }), `question.${extensionFor(mimeType)}`)
    }
    s.recorder = recorder
    s.sendOnStop = false
    recorder.start(250)

    analyserRef.current = s.micAnalyser
    setHeard(false)
    setNotice('')
    setLanguageAlert(null)
    setAudioFailed(false)
    setPhase('listening')

    s.vad = createVoiceActivityDetector(s.micAnalyser, {
      silenceMs: 2000,
      onSpeechStart: () => setHeard(true),
      onSpeechReset: () => setHeard(false),
      onSpeechEnd: () => finishListening(s, true),
      onNoSpeech: () => {
        finishListening(s, false)
        setNotice('Je n’ai rien entendu. Touchez le micro quand vous êtes prêt.')
      },
    })
  }

  function finishListening(s, send) {
    s.vad?.stop()
    s.vad = null
    analyserRef.current = null
    if (!s.recorder) return
    s.sendOnStop = send
    if (s.recorder.state !== 'inactive') s.recorder.stop()
    s.recorder = null
    setPhase(send ? 'thinking' : 'idle')
  }

  function sendRecording(s, blob, filename) {
    if (blob.size < MIN_RECORDING_BYTES) {
      setPhase('idle')
      setNotice('Je n’ai pas bien entendu. Touchez le micro et réessayez.')
      return
    }

    const currentChat = chatRef.current
    const { userId, botId } = currentChat.beginVoiceTurn()
    const queue = createQueue()
    s.turn = { userId, botId }
    s.queue = queue
    setAnswer('')
    setAudioFailed(false)
    setPhase('thinking')

    s.cancelRequest = sendVoiceMessage({
      conversationId: currentChat.conversationIdRef.current,
      file: blob,
      filename,
      lang,
      tts: true,
      onConversationId: (id) => { chatRef.current.conversationIdRef.current = id },
      onResponse: (text) => {
        setAnswer(text)
        if (text) chatRef.current.updateMessage(botId, { content: text, status: 'streaming' })
      },
      onAudioChunk: (chunk) => enqueueAudio(s, queue, chunk),
      onLanguageAlert: (alert) => setLanguageAlert(alert),
      onError: (error) => {
        s.cancelRequest = null
        s.turn = null
        chatRef.current.updateMessage(botId, { status: 'error', error: error.message })
        stopPlayback(s)
        analyserRef.current = null
        setPhase('idle')
        setNotice(error.message)
      },
      onComplete: ({ conversationId }) => {
        s.cancelRequest = null
        s.turn = null
        chatRef.current.updateMessage(botId, { status: 'done' })
        if (s.queue === queue) {
          queue.streamDone = true
          pump(s)
        }
        // La transcription n'est pas dans le flux : on la relit dans l'historique persisté.
        fetchMessages(conversationId)
          .then((messages) => {
            const transcript = lastUserContent(messages)
            if (transcript) chatRef.current.updateMessage(userId, { content: transcript })
          })
          .catch(() => {})
      },
    })
  }

  function createQueue() {
    return {
      items: new Map(),
      next: null,
      streamDone: false,
      playing: false,
      finished: false,
      received: 0,
      played: 0,
      failed: false,
      abort: new AbortController(),
    }
  }

  // Les morceaux sont téléchargés dès leur annonce, puis joués dans l'ordre de leur index.
  function enqueueAudio(s, queue, { audioUrl, index } = {}) {
    const url = resolveAudioUrl(audioUrl)
    // Un morceau d'une réponse interrompue n'a plus rien à faire dans la file courante.
    if (s.queue !== queue || !url) return
    const position = Number.isInteger(index) ? index : (queue.next ?? 0) + queue.items.size
    if (queue.next === null) queue.next = position
    queue.received += 1
    queue.items.set(position, fetch(url, { signal: queue.abort.signal }).then((response) => {
      if (!response.ok) throw new Error(`Audio ${response.status}`)
      return response.blob()
    }))
    pump(s)
  }

  function pump(s) {
    const queue = s.queue
    if (!queue || queue.playing || s.disposed) return

    if (queue.next === null || !queue.items.has(queue.next)) {
      const remaining = [...queue.items.keys()].sort((a, b) => a - b)
      // Flux terminé : on saute un éventuel morceau manquant, ou on clôt la réponse.
      if (queue.streamDone && remaining.length) queue.next = remaining[0]
      else {
        if (queue.streamDone) playbackFinished(s)
        return
      }
    }

    const item = queue.items.get(queue.next)
    queue.items.delete(queue.next)
    queue.playing = true
    analyserRef.current = s.outAnalyser
    setPhase('speaking')

    item
      .then((blob) => playBlob(s, blob))
      .then((played) => {
        if (played) queue.played += 1
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return
        queue.failed = true
        console.warn('[Tontouma] Morceau de réponse vocale illisible :', error)
      })
      .finally(() => {
        queue.playing = false
        queue.next += 1
        if (s.queue === queue) pump(s)
      })
  }

  /**
   * Joue un morceau via le moteur audio de la page (déjà activé par l'appui sur le micro) :
   * aucun bouton « lecture », et fiable sur iPhone. Résout à true une fois le morceau entièrement joué.
   */
  async function playBlob(s, blob) {
    if (s.disposed) return false
    if (s.ctx.state === 'suspended') await s.ctx.resume().catch(() => {})
    if (s.ctx.state !== 'running') throw new Error('Moteur audio en pause : le navigateur attend un appui.')

    let buffer
    try {
      buffer = await s.ctx.decodeAudioData(await blob.arrayBuffer())
    } catch {
      // Format que le moteur audio ne sait pas décoder : lecture classique en secours.
      return playWithElement(s, blob)
    }
    if (s.disposed) return false

    return new Promise((resolve) => {
      const source = s.ctx.createBufferSource()
      source.buffer = buffer
      source.connect(s.outAnalyser)
      const finish = (played) => {
        source.onended = null
        source.disconnect()
        if (s.audio?.source === source) s.audio = null
        resolve(played)
      }
      source.onended = () => finish(true)
      s.audio = {
        source,
        stop: () => {
          source.onended = null
          try { source.stop() } catch { /* déjà arrêté */ }
          finish(false)
        },
      }
      source.start()
    })
  }

  function playWithElement(s, blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      let source = null
      try {
        source = s.ctx.createMediaElementSource(audio)
        source.connect(s.outAnalyser)
      } catch {
        source = null
      }
      const cleanup = () => {
        audio.onended = null
        audio.onerror = null
        source?.disconnect()
        URL.revokeObjectURL(url)
        if (s.audio?.source === audio) s.audio = null
      }
      audio.onended = () => { cleanup(); resolve(true) }
      audio.onerror = () => { cleanup(); reject(new Error(`Format audio non pris en charge (${blob.type || 'inconnu'})`)) }
      s.audio = { source: audio, stop: () => { audio.pause(); cleanup(); resolve(false) } }
      audio.play().catch((error) => { cleanup(); reject(error) })
    })
  }

  function stopPlayback(s) {
    if (s.queue) {
      s.queue.abort.abort()
      s.queue = null
    }
    s.audio?.stop()
    s.audio = null
  }

  function playbackFinished(s) {
    const queue = s.queue
    if (!queue || queue.finished) return
    queue.finished = true
    analyserRef.current = null
    if (s.disposed) return

    // Rien n'a pu être joué : le texte s'affiche en secours et l'écoute ne reprend pas toute seule.
    if (!queue.played) {
      console.warn(queue.received
        ? '[Tontouma] Réponse vocale reçue mais illisible (voir les avertissements ci-dessus et l’onglet Réseau).'
        : '[Tontouma] Le serveur n’a envoyé aucun audio (événement audio-chunk) pour cette réponse : synthèse vocale désactivée ou en échec côté backend.')
      setAudioFailed(true)
      setPhase('idle')
      setNotice('La réponse vocale n’a pas pu être lue. Voici la réponse écrite.')
      return
    }
    if (queue.failed) setNotice('Une partie de la réponse vocale n’a pas pu être lue.')

    // La conversation s'enchaîne : Tontouma se remet à écouter sans nouvel appui.
    // Avec handsFree à false, il attendrait un appui pour chaque question.
    if (handsFreeRef.current) startListening()
    else setPhase('idle')
  }

  function cancelTurn(s) {
    s.cancelRequest?.()
    s.cancelRequest = null
    if (s.turn) chatRef.current.updateMessage(s.turn.botId, { status: 'stopped' })
    s.turn = null
  }

  /** Bouton principal : parler, terminer sa phrase ou interrompre la réponse pour reparler. */
  function toggle() {
    const s = sessionRef.current
    if (!s) return
    if (phase === 'listening') finishListening(s, true)
    else if (phase === 'speaking' || phase === 'idle') startListening()
  }

  /** Bouton « Annuler » : coupe l'écoute, l'attente ou la réponse en cours ; l'usager reste sur l'écran vocal. */
  function cancel() {
    const s = sessionRef.current
    if (!s) return
    finishListening(s, false)
    cancelTurn(s)
    stopPlayback(s)
    analyserRef.current = null
    setHeard(false)
    setNotice('')
    setPhase('idle')
  }

  useEffect(() => {
    const s = { disposed: false }
    sessionRef.current = s
    // Rien ne démarre à l'arrivée : l'usager touche le micro quand il est prêt.

    return () => {
      s.disposed = true
      s.vad?.stop()
      if (s.recorder && s.recorder.state !== 'inactive') {
        s.sendOnStop = false
        s.recorder.stop()
      }
      cancelTurn(s)
      stopPlayback(s)
      s.stream?.getTracks().forEach((track) => track.stop())
      s.ctx?.close()
      analyserRef.current = null
    }
    // La session est liée au montage (une langue = une session) : pas de dépendances.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { phase, heard, answer, audioFailed, notice, languageAlert, analyserRef, toggle, cancel }
}

export default useVoiceAssistant
