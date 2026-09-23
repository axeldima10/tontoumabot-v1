import { useEffect, useRef, useState } from 'react'
import { AudioLines, House, MessageCircle, MessageSquareText, Power, SquarePen, X } from 'lucide-react'
import botImage from '../../assets/images/tontuma-bot.png'
import { viewHref } from '../../hooks/useHashView'
import { cn } from '../../lib/cn'
import { TextSizeToggle, ThemeToggle } from './ThemeControls'
import '../../css/Sidebar.css'

const navigation = [
  { view: 'home', label: 'Accueil', icon: House },
  { view: 'chat', label: 'Discussion', icon: MessageSquareText },
  { view: 'voice', label: 'Mode vocal', icon: AudioLines },
]

// Action destructive : un premier appui demande confirmation, le second efface la session.
function EndSessionButton({ onConfirm }) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return undefined
    const timer = setTimeout(() => setConfirming(false), 3500)
    return () => clearTimeout(timer)
  }, [confirming])

  function handleClick() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setConfirming(false)
    onConfirm()
  }

  return (
    <button type="button" className={cn('sidebar-end', confirming && 'is-confirming')} onClick={handleClick}>
      <Power aria-hidden="true" />
      <span aria-live="polite">{confirming ? 'Confirmer : tout effacer' : 'Terminer la session'}</span>
    </button>
  )
}

// Menu principal : colonne fixe sur ordinateur, tiroir modal sur mobile.
function Sidebar({ view, open, isDesktop, recents, onClose, onNewChat, onOpenRecent, onEndSession }) {
  const firstActionRef = useRef(null)
  const drawer = !isDesktop

  useEffect(() => {
    if (!drawer || !open) return undefined
    firstActionRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [drawer, open, onClose])

  return (
    <>
      {drawer && <div className={cn('sidebar-scrim', open && 'is-open')} onClick={onClose} aria-hidden="true" />}
      <aside
        className={cn('sidebar glass', open && 'is-open')}
        inert={drawer && !open}
        role={drawer ? 'dialog' : undefined}
        aria-modal={drawer && open ? true : undefined}
        aria-label="Menu principal"
      >
        <div className="sidebar-brand">
          <span className="sidebar-logo">
            <img src={botImage} alt="" width="432" height="430" />
          </span>
          <span className="sidebar-brand-text">
            <strong translate="no">TONTOUMA-BOT</strong>
            <span>Assistant d’accueil · v1.0</span>
          </span>
          {drawer && (
            <button type="button" className="glass-btn is-small" onClick={onClose} aria-label="Fermer le menu">
              <X aria-hidden="true" />
            </button>
          )}
        </div>

        <button type="button" className="sidebar-new" ref={firstActionRef} onClick={onNewChat}>
          <SquarePen aria-hidden="true" />
          Nouvelle discussion
        </button>

        <nav className="sidebar-nav" aria-label="Sections">
          {navigation.map(({ view: target, label, icon: Icon }) => (
            <a key={target} href={viewHref[target]} aria-current={view === target ? 'page' : undefined} onClick={onClose}>
              <Icon aria-hidden="true" />
              {label}
            </a>
          ))}
        </nav>

        <div className="sidebar-recents">
          <p className="sidebar-label">Cette discussion</p>
          {recents.length ? (
            <ul>
              {recents.map((message) => (
                <li key={message.id}>
                  <button type="button" onClick={() => onOpenRecent(message.id)}>
                    <MessageCircle aria-hidden="true" />
                    <span>{message.content}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sidebar-empty">Vos questions apparaîtront ici. Rien n’est conservé après la fin de la session.</p>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-prefs">
            <ThemeToggle labelled />
            <TextSizeToggle />
          </div>
          <EndSessionButton onConfirm={onEndSession} />
          <p className="sidebar-credit">Propulsé de manière sécurisée par Tontouma Bot</p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
