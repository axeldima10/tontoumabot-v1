import { ChevronDown, Globe2 } from 'lucide-react'
import '../../css/Topbar.css'

// Barre d'identification de l'assistant actif ; la logique de navigation pourra y être ajoutée plus tard.
function Topbar() {
  return (
    <header className="topbar">
      <button className="bot-selector" aria-label="Assistant actif">
        <Globe2 />
        TONTUMA-BOT
        <span>v1.0</span>
        <ChevronDown />
      </button>
    </header>
  )
}

export default Topbar
