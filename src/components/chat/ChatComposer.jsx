import { useEffect, useRef } from 'react'
import { ArrowUp, Globe2, Mic, Square } from 'lucide-react'
import { languageNames } from '../../hooks/useDashboard'
import { viewHref } from '../../hooks/useHashView'

const MAX_HEIGHT = 168

// Zone de saisie en verre : Entrée envoie, Maj + Entrée ajoute une ligne.
function ChatComposer({ draft, onChange, onSubmit, onStop, isStreaming, language, onCycleLanguage }) {
  const inputRef = useRef(null)
  const canSend = draft.trim().length > 0

  useEffect(() => {
    // Sur ordinateur, on peut écrire immédiatement ; sur mobile, on évite d'ouvrir le clavier d'office.
    if (window.matchMedia('(min-width: 1024px)').matches) inputRef.current?.focus()
  }, [])

  useEffect(() => {
    // Hauteur automatique : le champ grandit avec le texte jusqu'à un plafond.
    const input = inputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, MAX_HEIGHT)}px`
  }, [draft])

  function handleKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    onSubmit()
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="composer glass" onSubmit={handleSubmit} aria-label="Écrire à Tontouma">
      <label className="sr-only" htmlFor="chat-question">Votre question</label>
      <textarea
        id="chat-question"
        ref={inputRef}
        name="question"
        rows={1}
        value={draft}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Posez votre question…"
        autoComplete="off"
        enterKeyHint="send"
      />
      <div className="composer-bar">
        <button type="button" className="composer-chip" onClick={onCycleLanguage} aria-label={`Langue de réponse : ${languageNames[language]}. Changer de langue`}>
          <Globe2 aria-hidden="true" />
          <span>{languageNames[language]}</span>
        </button>
        <span className="composer-hint only-desktop" aria-hidden="true">Maj + Entrée pour aller à la ligne</span>
        <a className="composer-icon" href={viewHref.voice} aria-label="Passer en mode vocal" title="Mode vocal">
          <Mic aria-hidden="true" />
        </a>
        {isStreaming ? (
          <button type="button" className="composer-send is-stop" onClick={onStop} aria-label="Arrêter la réponse">
            <Square aria-hidden="true" />
          </button>
        ) : (
          <button type="submit" className="composer-send" disabled={!canSend} aria-label="Envoyer">
            <ArrowUp aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  )
}

export default ChatComposer
