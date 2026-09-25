import { House, LogOut } from 'lucide-react'
import botImage from '../../assets/images/tontuma-bot.png'
import Flag from '../voice/Flag'

// Barre de la borne : toujours les mêmes repères (accueil, langue, terminer), en très grand.
function KioskTopBar({ copy, language, showHome, onHome, onLanguage, onEnd }) {
  return (
    <header className="kiosk-bar">
      <span className="kiosk-bar-brand">
        <img src={botImage} alt="" width="432" height="430" />
        <span translate="no">TONTOUMA</span>
      </span>
      <nav className="kiosk-bar-actions" aria-label="Navigation de la borne">
        {showHome && (
          <button type="button" className="kiosk-bar-btn glass" onClick={onHome}>
            <House aria-hidden="true" />
            <span>{copy.home}</span>
          </button>
        )}
        <button type="button" className="kiosk-bar-btn glass" onClick={onLanguage} aria-label={`${copy.language} : ${language.name}`}>
          <Flag code={language.flag} />
          <span>{language.name}</span>
        </button>
        <button type="button" className="kiosk-bar-btn is-end" onClick={onEnd}>
          <LogOut aria-hidden="true" />
          <span>{copy.end}</span>
        </button>
      </nav>
    </header>
  )
}

export default KioskTopBar
