import { Accessibility, Moon, Power, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import '../../css/SessionControls.css'

// Contrôles persistants de la session : thème, accessibilité et fin de session.
function SessionControls({ onEndSession }) {
  const { dark, toggleTheme } = useTheme()

  return (
    <>
      <div className="session-actions">
        <button className="accessibility-button" aria-label="Ouvrir les options d’accessibilité">
          <Accessibility />
          <span>Accessibilité</span>
        </button>
        <button
          className={`theme-toggle ${dark ? 'is-dark' : ''}`}
          onClick={toggleTheme}
          aria-pressed={dark}
          aria-label={dark ? 'Passer au thème clair' : 'Passer au thème sombre'}
        >
          <span className="theme-toggle-track" aria-hidden="true">
            <span className="theme-toggle-thumb">{dark ? <Moon /> : <Sun />}</span>
          </span>
        </button>
      </div>
      <footer className="session-footer">
        <button onClick={onEndSession} title="Effacer les informations de cette session">
          <Power />
          Terminer la session
        </button>
        <span>Propulsé de manière sécurisée par Tontouma Bot</span>
      </footer>
    </>
  )
}

export default SessionControls
