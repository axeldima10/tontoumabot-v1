import { Menu } from 'lucide-react'
import { cn } from '../../lib/cn'
import '../../css/AppHeader.css'

// En-tête commun : menu (mobile), titre centré, actions à droite — comme sur les maquettes mobiles.
function AppHeader({ title, onMenu, aside, right, className }) {
  return (
    <header className={cn('app-header', className)} data-anim="header">
      <div className="app-header-side">
        <button type="button" className="glass-btn only-mobile" onClick={onMenu} aria-label="Ouvrir le menu">
          <Menu aria-hidden="true" />
        </button>
        {aside && <span className="app-header-aside only-desktop">{aside}</span>}
      </div>
      <p className="app-header-title">{title}</p>
      <div className="app-header-side is-end">{right}</div>
    </header>
  )
}

export default AppHeader
