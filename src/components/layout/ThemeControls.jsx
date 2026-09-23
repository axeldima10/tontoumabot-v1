import { Moon, Sun, Type } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/cn'

// Bouton rond en verre ; la variante « labelled » est utilisée dans le menu latéral.
export function ThemeToggle({ labelled = false, className }) {
  const { dark, toggleTheme } = useTheme()
  const label = dark ? 'Passer au thème clair' : 'Passer au thème sombre'

  return (
    <button
      type="button"
      className={cn(labelled ? 'glass-pill' : 'glass-btn', className)}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <span className="icon-swap" key={dark ? 'sun' : 'moon'}>{dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}</span>
      {labelled && <span aria-hidden="true">{dark ? 'Clair' : 'Sombre'}</span>}
    </button>
  )
}

// Agrandit toute la typographie de l'application (les tailles sont exprimées en rem).
export function TextSizeToggle() {
  const { largeText, toggleLargeText } = useTheme()

  return (
    <button type="button" className="glass-pill" onClick={toggleLargeText} aria-pressed={largeText}>
      <Type aria-hidden="true" />
      <span>Texte agrandi</span>
    </button>
  )
}
