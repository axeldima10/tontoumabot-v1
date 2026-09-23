import { useEffect, useRef, useState } from 'react'
import { Globe2, MessageSquareText, Mic, MicOff, X } from 'lucide-react'
import { languageNames } from '../../hooks/useDashboard'
import { viewHref } from '../../hooks/useHashView'
import { cn } from '../../lib/cn'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'
import { getAccessToken } from '../../services/authService'
import { voiceSocketService } from '../../services/voiceService'
import AppHeader from '../layout/AppHeader'
import VoiceOrb from './VoiceOrb'
import '../../css/VoiceView.css'

const titles = {
  connecting: 'Connexion…',
  ready: 'Je suis prêt',
  listening: 'Je vous écoute…',
  speaking: 'Tontouma répond…',
  unavailable: 'Mode vocal indisponible',
}

const defaultHint = 'Parlez naturellement, en français, en wolof ou en anglais : je vous oriente et vous accompagne dans vos démarches.'

// Encapsule le microphone, le WebSocket audio et la lecture des réponses vocales.
function VoiceView({ language, onCycleLanguage, onMenu, onClose }) {
  const rootRef = useRef(null)
  const recorderRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const analyserRef = useRef(null)
  const [phase, setPhase] = useState('connecting')
  const [hint, setHint] = useState(defaultHint)
  const [speaking, setSpeaking] = useState(false)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('[data-anim="header"]', { y: -14, autoAlpha: 0, duration: 0.5 })
        .from('.voice-title', { y: 20, autoAlpha: 0, duration: 0.7 }, '-=0.2')
        .from('.voice-hint', { y: 16, autoAlpha: 0, duration: 0.7 }, '+=0.3')
        .from('.voice-control', { y: 30, autoAlpha: 0, scale: 0.8, stagger: 0.08, duration: 0.6, ease: 'back.out(1.8)' }, '-=0.5')
    })
    return () => mm.revert()
  }, { scope: rootRef })

  useEffect(() => {
    let disposed = false
    let audioContext = null

    async function startVoiceSession() {
      // Le navigateur doit fournir MediaRecorder et l'accès au microphone.
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        setPhase('unavailable')
        setHint('La capture audio n’est pas disponible dans ce navigateur. Vous pouvez poursuivre par écrit.')
        return
      }

      const socket = voiceSocketService.connect(
        getAccessToken(),
        (audioBlob) => {
          // Chaque réponse audio est jouée dès sa réception. L'URL temporaire
          // est révoquée après lecture afin d'éviter une fuite mémoire.
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          audio.onplay = () => setSpeaking(true)
          audio.onended = () => {
            setSpeaking(false)
            URL.revokeObjectURL(audioUrl)
          }
          audio.play().catch(() => setHint('La lecture audio nécessite une interaction avec la page. Touchez l’écran puis réessayez.'))
        },
        (error) => setHint(`${error.message} Vérifiez votre connexion puis réessayez.`),
      )

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        mediaStreamRef.current = stream

        // L'analyseur ne sert qu'à l'animation de la sphère : son absence n'empêche pas l'enregistrement.
        const AudioContextClass = window.AudioContext || window.webkitAudioContext
        if (AudioContextClass) {
          audioContext = new AudioContextClass()
          const analyser = audioContext.createAnalyser()
          analyser.fftSize = 512
          audioContext.createMediaStreamSource(stream).connect(analyser)
          analyserRef.current = analyser
        }

        const recorder = new MediaRecorder(stream)
        recorderRef.current = recorder
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            voiceSocketService.sendAudioChunk(event.data)
          }
        }
        recorder.onstart = () => {
          audioContext?.resume()
          setPhase('listening')
        }
        recorder.onstop = () => setPhase('ready')

        // Le bouton démarrera effectivement l'enregistrement après connexion.
        setPhase('ready')
      } catch (error) {
        voiceSocketService.disconnect()
        setPhase('unavailable')
        setHint(error.name === 'NotAllowedError'
          ? 'L’accès au microphone a été refusé. Autorisez-le dans les réglages du navigateur, ou poursuivez par écrit.'
          : 'Impossible d’ouvrir le microphone. Vérifiez qu’il est branché, ou poursuivez par écrit.')
      }
    }

    startVoiceSession()

    return () => {
      disposed = true
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      analyserRef.current = null
      audioContext?.close()
      voiceSocketService.disconnect()
    }
  }, [])

  function toggleRecording() {
    const recorder = recorderRef.current
    if (!recorder) return

    if (recorder.state === 'recording') {
      recorder.stop()
    } else if (recorder.state === 'inactive') {
      recorder.start(250)
    }
  }

  /*
   * L'ancienne version utilisait SpeechRecognition, qui transcrivait localement
   * la voix. Le contrat demandé utilise maintenant MediaRecorder : le navigateur
   * envoie les paquets audio au backend Python, qui renvoie des blobs à lire.
   */
  const listening = phase === 'listening'
  const title = speaking ? titles.speaking : titles[phase]
  const micDisabled = phase === 'connecting' || phase === 'unavailable'

  return (
    <div className="voice-view" ref={rootRef}>
      <AppHeader
        title={<>Parler avec <span translate="no">Tontouma</span></>}
        onMenu={onMenu}
        right={(
          <button type="button" className="glass-pill voice-lang" onClick={onCycleLanguage} aria-label={`Langue : ${languageNames[language]}. Changer de langue`}>
            <Globe2 aria-hidden="true" />
            <span className="only-desktop">{languageNames[language]}</span>
            <span className="only-mobile">{language}</span>
          </button>
        )}
      />

      <section className="voice-stage" aria-labelledby="voice-title">
        <h1 id="voice-title" className="voice-title" aria-live="polite">{title}</h1>
        <VoiceOrb analyserRef={analyserRef} listening={listening} speaking={speaking} />
        <p className="voice-hint" aria-live="polite">{hint}</p>
      </section>

      <div className="voice-controls" role="group" aria-label="Commandes vocales">
        <a className="voice-control glass-btn is-large" href={viewHref.chat} aria-label="Poursuivre par écrit" title="Poursuivre par écrit">
          <MessageSquareText aria-hidden="true" />
        </a>
        <button
          type="button"
          className={cn('voice-control voice-mic', listening && 'is-listening')}
          onClick={toggleRecording}
          disabled={micDisabled}
          aria-pressed={listening}
          aria-label={listening ? 'Arrêter l’écoute' : 'Commencer à parler'}
        >
          {micDisabled && phase === 'unavailable' ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
        </button>
        <button type="button" className="voice-control glass-btn is-large" onClick={onClose} aria-label="Quitter le mode vocal" title="Quitter">
          <X aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export default VoiceView
