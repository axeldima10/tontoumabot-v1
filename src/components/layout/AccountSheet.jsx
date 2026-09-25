import { useEffect, useRef } from 'react'
import { History, LogIn, MonitorSmartphone, UserPlus, X } from 'lucide-react'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'
import { SIGN_IN_URL, SIGN_UP_URL } from '../../services/authService'
import '../../css/AccountSheet.css'

const benefits = [
  { icon: History, text: 'Retrouvez l’historique de toutes vos conversations.' },
  { icon: MonitorSmartphone, text: 'Reprenez une démarche là où vous l’avez laissée, sur n’importe quel appareil.' },
]

// Lien réel si la page existe, sinon bouton désactivé et explicite (jamais de bouton qui ne fait rien).
function AuthAction({ href, icon: Icon, children, primary }) {
  const className = primary ? 'account-primary' : 'account-secondary'
  if (href) {
    return <a className={className} href={href}><Icon aria-hidden="true" />{children}</a>
  }
  return (
    <button type="button" className={className} disabled aria-describedby="account-soon">
      <Icon aria-hidden="true" />{children}
    </button>
  )
}

/**
 * Fenêtre « compte » : la connexion reste facultative (mode invité par défaut),
 * elle explique simplement ce qu'elle apporte : l'historique des conversations.
 */
function AccountSheet({ open, onClose }) {
  const rootRef = useRef(null)
  const closeRef = useRef(null)
  const available = Boolean(SIGN_IN_URL || SIGN_UP_URL)

  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    closeRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      // Le focus revient là où l'usager se trouvait avant l'ouverture.
      previous?.focus?.()
    }
  }, [open, onClose])

  useGSAP(() => {
    if (!open) return undefined
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.account-scrim', { autoAlpha: 0, duration: 0.3 })
        .from('.account-sheet', { y: 60, autoAlpha: 0, duration: 0.55, ease: 'back.out(1.3)' }, '<')
        .from('.account-benefits li', { x: -12, autoAlpha: 0, stagger: 0.08, duration: 0.4 }, '-=0.25')
    })
    return () => mm.revert()
  }, { dependencies: [open], scope: rootRef })

  if (!open) return null

  return (
    <div className="account-layer" ref={rootRef}>
      <div className="account-scrim" onClick={onClose} aria-hidden="true" />
      <section className="account-sheet glass" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <button type="button" className="account-close" ref={closeRef} onClick={onClose} aria-label="Fermer">
          <X aria-hidden="true" />
        </button>
        <span className="account-badge" aria-hidden="true"><History /></span>
        <h2 id="account-title">Gardez vos conversations</h2>
        <p className="account-lead">
          Sans compte, tout fonctionne : vos échanges sont simplement effacés à la fin de la session.
          Connectez-vous pour les conserver.
        </p>
        <ul className="account-benefits">
          {benefits.map(({ icon: Icon, text }) => (
            <li key={text}><Icon aria-hidden="true" />{text}</li>
          ))}
        </ul>
        <div className="account-actions">
          <AuthAction href={SIGN_IN_URL} icon={LogIn} primary>Se connecter</AuthAction>
          <AuthAction href={SIGN_UP_URL} icon={UserPlus}>Créer un compte</AuthAction>
        </div>
        {!available && <p className="account-soon" id="account-soon">La connexion sera bientôt disponible.</p>}
        <button type="button" className="account-guest" onClick={onClose}>Continuer en mode invité</button>
      </section>
    </div>
  )
}

export default AccountSheet
