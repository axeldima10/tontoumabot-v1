import { Globe2, Mic, Plus, Send, Sparkles } from 'lucide-react'
import '../../css/QuestionComposer.css'

// Formulaire contrôlé : la valeur du champ appartient au hook et remonte par onChange.
function QuestionComposer({ question, onChange, onSubmit, onVoiceOpen, language, cycleLanguage, toolsOpen, setToolsOpen, notice, voiceOpen }) {
  function handleKeyDown(event) {
    // Évite de soumettre pendant la composition d'un caractère asiatique ou accentué.
    if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) onSubmit()
  }

  return (
    <section className="composer" aria-label="Poser une question">
      <div className="composer-input-row">
        <Sparkles className="composer-spark" />
        <input
          value={question}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez-moi votre question..."
          aria-label="Votre question"
        />
      </div>
      <div className="composer-actions">
        <button className="round-action" aria-label="Ajouter" onClick={() => onChange(`${question} `)}><Plus /></button>
        <button className={`pill-action ${toolsOpen ? 'is-active' : ''}`} onClick={() => setToolsOpen(!toolsOpen)}>⚙ Outils</button>
        <button className="pill-action" onClick={cycleLanguage}><Globe2 /> Langue : {language}</button>
        <button className={`mic-action ${voiceOpen ? 'is-active' : ''}`} aria-label={voiceOpen ? 'Fermer la saisie vocale' : 'Utiliser le microphone'} aria-pressed={voiceOpen} onClick={onVoiceOpen}><Mic /></button>
        <button className="send-action" onClick={onSubmit} aria-label="Envoyer"><Send /></button>
      </div>
      {toolsOpen && <div className="tools-popover" role="status">Options disponibles : langue, lecture vocale et accessibilité.</div>}
      {notice && <span className="sr-only">{notice}</span>}
    </section>
  )
}

export default QuestionComposer
