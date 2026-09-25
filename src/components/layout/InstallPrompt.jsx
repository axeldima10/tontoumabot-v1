import { useRef, useSyncExternalStore } from 'react'
import { Download, Share, SquarePlus, X } from 'lucide-react'
import botImage from '../../assets/images/tontuma-bot.png'
import { dismissInstall, getInstallMode, promptInstall, subscribeInstall } from '../../lib/installPrompt'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'
import '../../css/InstallPrompt.css'

// Carte flottante proposant l'installation, affichée après une première réponse réussie.
function InstallPrompt() {
  const mode = useSyncExternalStore(subscribeInstall, getInstallMode, () => null)
  const rootRef = useRef(null)

  useGSAP(() => {
    if (!mode) return undefined
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.from(rootRef.current, { y: -24, autoAlpha: 0, scale: 0.96, duration: 0.7, delay: 1.2, ease: 'back.out(1.6)' })
    })
    return () => mm.revert()
  }, { dependencies: [mode], scope: rootRef })

  if (!mode) return null

  return (
    <aside className="install-card glass" ref={rootRef} aria-label="Installer l’application">
      <img className="install-icon" src={botImage} alt="" width="432" height="430" />
      <div className="install-text">
        <strong>Installez Tontouma</strong>
        {mode === 'prompt' ? (
          <span>Accès direct depuis votre écran d’accueil, en plein écran.</span>
        ) : (
          <span>
            Touchez <Share className="install-inline" aria-label="Partager" /> puis
            {' '}<SquarePlus className="install-inline" aria-hidden="true" /> «&nbsp;Sur l’écran d’accueil&nbsp;».
          </span>
        )}
      </div>
      {mode === 'prompt' && (
        <button type="button" className="install-go" onClick={promptInstall}>
          <Download aria-hidden="true" />
          Installer
        </button>
      )}
      <button type="button" className="install-close" onClick={dismissInstall} aria-label="Plus tard">
        <X aria-hidden="true" />
      </button>
    </aside>
  )
}

export default InstallPrompt
