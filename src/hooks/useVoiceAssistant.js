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
 * Assistant vocal « mains libres » façon Siri / Alexa :
 * écoute → détection de fin de phrase (VAD) → envoi HTTP → réponse SSE (texte + audio) → nouvelle écoute.
 *
 * Phases : starting | idle | listening | thinking | speaking | unavailable
 */
function useVoiceAssistant({ lang, chat }) {
  const [phase, setPhase] = useState('starting')
  const [heard, setHeard] = useState(false)
  const [answer, setAnswer] = useState('')
  const [notice, setNotice] = useState('')
  const [languageAlert, setLanguageAlert] = useState(null)
  // Analyseur affiché par la sphère : micro pendant l'écoute, voix de Tontouma pendant la réponse.
  const analyserRef = useRef(null)
  // Une session par montage : protège des doubles montages de StrictMode et des callbacks tardifs.
  const sessionRef = useRef(null)
  const chatRef = useRef(chat)

  useLayoutEffect(() => {
    chatRef.current = chat
  })

  async function setup(s) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
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
    if (!s.stream && !(await setup(s))) return
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
    setPhase('listening')

    s.vad = createVoiceActivityDetector(s.micAnalyser, {
      silenceMs: 2000,
      onSpeechStart: () => setHeard(true),
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
    return { items: new Map(), next: null, streamDone: false, playing: false, finished: false, abort: new AbortController() }
  }

  // Les morceaux sont téléchargés dès leur annonce, puis joués dans l'ordre de leur index.
  function enqueueAudio(s, queue, { audioUrl, index } = {}) {
    const url = resolveAudioUrl(audioUrl)
    // Un morceau d'une réponse interrompue n'a plus rien à faire dans la file courante.
    if (s.queue !== queue || !url) return
    const position = Number.isInteger(index) ? index : (queue.next ?? 0) + queue.items.size
    if (queue.next === null) queue.next = position
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
      .catch(() => {})
      .finally(() => {
        queue.playing = false
        queue.next += 1
        if (s.queue === queue) pump(s)
      })
  }

  function playBlob(s, blob) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      let source = null
      try {
        // Le son passe par l'analyseur pour animer la sphère au rythme de la voix.
        source = s.ctx.createMediaElementSource(audio)
        source.connect(s.outAnalyser)
      } catch {
        source = null
      }
      const end = () => {
        audio.onended = null
        audio.onerror = null
        source?.disconnect()
        URL.revokeObjectURL(url)
        if (s.audio?.element === audio) s.audio = null
        resolve()
      }
      s.audio = { element: audio, end }
      audio.onended = end
      audio.onerror = end
      audio.play().catch(end)
    })
  }

  function stopPlayback(s) {
    if (s.queue) {
      s.queue.abort.abort()
      s.queue = null
    }
    if (s.audio) {
      s.audio.element.pause()
      s.audio.end()
    }
  }

  function playbackFinished(s) {
    const queue = s.queue
    if (!queue || queue.finished) return
    queue.finished = true
    analyserRef.current = null
    if (s.disposed) return
    // Conversation continue : Tontouma se remet à écouter, comme un assistant vocal.
    startListening()
  }

  function cancelTurn(s) {
    s.cancelRequest?.()
    s.cancelRequest = null
    if (s.turn) chatRef.current.updateMessage(s.turn.botId, { status: 'stopped' })
    s.turn = null
  }

  /** Bouton principal : parler, terminer sa phrase, annuler l'attente ou interrompre la réponse. */
  function toggle() {
    const s = sessionRef.current
    if (!s) return
    if (phase === 'listening') finishListening(s, true)
    else if (phase === 'thinking') {
      cancelTurn(s)
      setPhase('idle')
    } else if (phase === 'speaking' || phase === 'idle') startListening()
  }

  useEffect(() => {
    const s = { disposed: false }
    sessionRef.current = s
    // Arrivée sur l'écran = intention de parler : l'écoute démarre immédiatement.
    startListening()

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

  return { phase, heard, answer, notice, languageAlert, analyserRef, toggle }
}

export default useVoiceAssistant
