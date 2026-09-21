import { useEffect, useRef, useState } from 'react'
import { Check, Globe2, Mic, MicOff, X } from 'lucide-react'
import { getAccessToken } from '../../services/authService'
import { voiceSocketService } from '../../services/voiceService'
import '../../css/VoiceScreen.css'

const bars = [18, 32, 24, 42, 28, 48, 30, 44, 25, 38, 21, 35, 26, 45, 31, 40, 22, 34, 28, 43, 24, 37, 20, 31]

// Encapsule le microphone, le WebSocket audio et la lecture des réponses vocales.
function VoiceScreen({ language, onLanguageChange, onClose }) {
  const recorderRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const [recording, setRecording] = useState(false)
  const [supported, setSupported] = useState(true)
  const [status, setStatus] = useState('Connexion au service vocal…')

  useEffect(() => {
    let disposed = false

    async function startVoiceSession() {
      // Le navigateur doit fournir MediaRecorder et l'accès au microphone.
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        setSupported(false)
        setStatus('La capture audio n’est pas disponible dans ce navigateur.')
        return
      }

      const socket = voiceSocketService.connect(
        getAccessToken(),
        (audioBlob) => {
          // Chaque réponse audio est jouée dès sa réception. L'URL temporaire
          // est révoquée après lecture afin d'éviter une fuite mémoire.
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          audio.onended = () => URL.revokeObjectURL(audioUrl)
          audio.play().catch(() => setStatus('La lecture audio nécessite une interaction du navigateur.'))
        },
        (error) => setStatus(error.message),
      )

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        mediaStreamRef.current = stream
        const recorder = new MediaRecorder(stream)
        recorderRef.current = recorder
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            voiceSocketService.sendAudioChunk(event.data)
          }
        }
        recorder.onstart = () => {
          setRecording(true)
          setStatus('Je vous écoute…')
        }
        recorder.onstop = () => {
          setRecording(false)
          setStatus('Prêt à vous écouter')
        }

        // Le bouton démarrera effectivement l'enregistrement après connexion.
        setStatus('Prêt à vous écouter')
      } catch (error) {
        voiceSocketService.disconnect()
        setSupported(false)
        setStatus(error.name === 'NotAllowedError' ? 'L’accès au microphone a été refusé.' : 'Impossible d’ouvrir le microphone.')
      }
    }

    startVoiceSession()

    return () => {
      disposed = true
      recorderRef.current?.stop()
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
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
  if (!supported) {
    return (
      <section className="voice-panel" aria-label="Saisie vocale">
        <div className="voice-panel-head">
          <div><p className="section-kicker">MODE VOCAL</p><h2>{status}</h2></div>
          <button className="voice-close" onClick={onClose} aria-label="Revenir à l’écriture"><X /></button>
        </div>
      </section>
    )
  }

  return (
    <section className="voice-panel" aria-label="Saisie vocale">
      <div className="voice-panel-head">
        <div>
          <p className="section-kicker">MODE VOCAL</p>
          <h2>{status}</h2>
        </div>
        <button className="voice-close" onClick={onClose} aria-label="Revenir à l’écriture"><X /></button>
      </div>
      <div className={`voice-live ${recording ? 'is-recording' : ''}`}>
        <button className="voice-mic-button" onClick={toggleRecording} aria-label={recording ? 'Arrêter la saisie vocale' : 'Démarrer la saisie vocale'}>
          {recording ? <Mic /> : <MicOff />}
        </button>
        <div className="voice-transcript">{status}</div>
        <div className="voice-bars" aria-hidden="true">
          {bars.slice(0, 12).map((height, index) => <span key={index} style={{ '--bar-height': `${height / 2}px`, '--delay': `${index * 35}ms` }} />)}
        </div>
      </div>
      <div className="voice-panel-actions">
        <button className="voice-language" onClick={() => onLanguageChange(language === 'Français' ? 'English' : language === 'English' ? 'Wolof' : 'Français')}><Globe2 /> {language}</button>
        <button className="voice-write" onClick={onClose}><Check /> Continuer par écrit</button>
      </div>
    </section>
  )
}

export default VoiceScreen
