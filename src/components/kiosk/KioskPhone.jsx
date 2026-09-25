import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'
import { publicAppUrl } from '../../lib/kiosk'
import KioskQr from './KioskQr'

// Fenêtre « Sur mon téléphone » : un QR code vers l'application publique, rien de personnel.
function KioskPhone({ copy, lang, onClose }) {
  const rootRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.from('.kiosk-scrim', { autoAlpha: 0, duration: 0.35 })
      gsap.from('.kiosk-card', { y: 60, scale: 0.94, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.5)' })
    })
    return () => mm.revert()
  }, { scope: rootRef })

  return (
    <div className="kiosk-layer" ref={rootRef} role="dialog" aria-modal="true" aria-labelledby="kphone-title" lang={lang}>
      <button type="button" className="kiosk-scrim" onClick={onClose} aria-label={copy.close} tabIndex={-1} />
      <div className="kiosk-card kphone-card">
        <button type="button" className="kiosk-close" ref={closeRef} onClick={onClose} aria-label={copy.close}>
          <X aria-hidden="true" />
        </button>
        <h2 id="kphone-title">{copy.qrTitle}</h2>
        <p>{copy.qrLead}</p>
        <div className="kiosk-qr-frame">
          <KioskQr value={publicAppUrl} label={copy.qrTitle} />
        </div>
      </div>
    </div>
  )
}

export default KioskPhone
