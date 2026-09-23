import { memo, useEffect, useRef, useState } from 'react'
import { Check, Copy, RotateCcw, Share2, Square, ThumbsDown, ThumbsUp, Volume2 } from 'lucide-react'
import botImage from '../../assets/images/tontuma-bot.png'
import { cn } from '../../lib/cn'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'
import FormattedText from './FormattedText'

const speechLang = { FR: 'fr-FR', WO: 'fr-SN', EN: 'en-US' }
const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window
const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Bouton « copier » avec confirmation visuelle éphémère.
function CopyButton({ text, className }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return undefined
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      className={cn('msg-action', className)}
      onClick={async () => setCopied(await copyText(text))}
      aria-label={copied ? 'Copié' : 'Copier le message'}
      title={copied ? 'Copié' : 'Copier'}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
    </button>
  )
}

// Lecture à voix haute par le navigateur : utile en borne d'accueil et pour l'accessibilité.
function ListenButton({ text, language }) {
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => () => {
    if (speaking) window.speechSynthesis.cancel()
  }, [speaking])

  function toggle() {
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = speechLang[language] ?? 'fr-FR'
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  return (
    <button type="button" className="msg-action" onClick={toggle} aria-pressed={speaking} aria-label={speaking ? 'Arrêter la lecture' : 'Écouter la réponse'} title={speaking ? 'Arrêter' : 'Écouter'}>
      {speaking ? <Square aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
    </button>
  )
}

function AssistantActions({ text, language }) {
  const [feedback, setFeedback] = useState(null)

  return (
    <div className="msg-actions" role="group" aria-label="Actions sur la réponse">
      <CopyButton text={text} />
      {canSpeak && <ListenButton text={text} language={language} />}
      <button type="button" className="msg-action" aria-pressed={feedback === 'up'} aria-label="Réponse utile" title="Utile" onClick={() => setFeedback((current) => (current === 'up' ? null : 'up'))}>
        <ThumbsUp aria-hidden="true" />
      </button>
      <button type="button" className="msg-action" aria-pressed={feedback === 'down'} aria-label="Réponse peu utile" title="Peu utile" onClick={() => setFeedback((current) => (current === 'down' ? null : 'down'))}>
        <ThumbsDown aria-hidden="true" />
      </button>
      {canShare && (
        <button type="button" className="msg-action" aria-label="Partager la réponse" title="Partager" onClick={() => navigator.share({ text }).catch(() => {})}>
          <Share2 aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

// Une ligne de conversation. Mémoïsée : seul le message en cours de flux se re-rend.
function ChatMessage({ message, language, animate, onRetry }) {
  const rowRef = useRef(null)
  const isUser = message.role === 'user'

  useGSAP(() => {
    if (!animate) return undefined
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.from(rowRef.current, { y: 16, x: isUser ? 12 : 0, autoAlpha: 0, duration: 0.5, ease: 'power3.out' })
    })
    return () => mm.revert()
  }, { scope: rowRef })

  if (isUser) {
    return (
      <div className="msg msg-user" ref={rowRef} id={`msg-${message.id}`}>
        <CopyButton text={message.content} className="msg-user-copy" />
        <p className="msg-bubble">{message.content}</p>
      </div>
    )
  }

  const { status, content } = message
  const waiting = status === 'pending'
  const finished = status === 'done' || status === 'stopped'

  return (
    <div className="msg msg-bot" ref={rowRef} id={`msg-${message.id}`}>
      <span className="msg-avatar" aria-hidden="true">
        <img src={botImage} alt="" width="432" height="430" />
      </span>
      <div className="msg-body">
        <span className="sr-only">Tontouma :</span>
        {waiting && (
          <span className="typing" role="status" aria-label="Tontouma rédige une réponse">
            <span /><span /><span />
          </span>
        )}
        {content && <FormattedText text={content} />}
        {status === 'streaming' && <span className="stream-caret" aria-hidden="true" />}
        {status === 'done' && !content && <p className="msg-muted">Aucune réponse n’a été reçue. Reformulez votre question ou réessayez.</p>}
        {status === 'stopped' && <p className="msg-muted">Réponse interrompue.</p>}
        {status === 'error' && (
          <div className="msg-error" role="alert">
            <p>{message.error || 'Une erreur est survenue.'} Vérifiez votre connexion puis réessayez.</p>
            <button type="button" className="glass-pill" onClick={() => onRetry(message.id)}>
              <RotateCcw aria-hidden="true" />
              Réessayer
            </button>
          </div>
        )}
        {finished && content && <AssistantActions text={content} language={language} />}
      </div>
    </div>
  )
}

export default memo(ChatMessage)
