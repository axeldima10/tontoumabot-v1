import { useEffect, useRef } from 'react'
import { useCountdown } from '../../hooks/useIdle'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'

const SECONDS = 20
const RADIUS = 44
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// « Vous êtes toujours là ? » : au bout du compte à rebours, la visite est effacée.
function KioskIdle({ copy, lang, onContinue, onEnd }) {
  const rootRef = useRef(null)
  const continueRef = useRef(null)
  const left = useCountdown(SECONDS, onEnd)

  useEffect(() => {
    continueRef.current?.focus()
  }, [])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.from('.kidle-scrim', { autoAlpha: 0, duration: 0.4 })
      gsap.from('.kidle-card', { y: 60, scale: 0.94, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.5)' })
    })
    // L'anneau se vide en continu, indépendamment des secondes affichées.
    gsap.fromTo('.kidle-ring-value', { strokeDashoffset: 0 }, { strokeDashoffset: CIRCUMFERENCE, duration: SECONDS, ease: 'none' })
    return () => mm.revert()
  }, { scope: rootRef })

  return (
    <div className="kiosk-layer" ref={rootRef} role="alertdialog" aria-modal="true" aria-labelledby="kidle-title" aria-describedby="kidle-lead" lang={lang}>
      <div className="kiosk-scrim kidle-scrim" />
      <div className="kiosk-card kidle-card">
        <div className="kidle-ring" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <circle className="kidle-ring-track" cx="50" cy="50" r={RADIUS} />
            <circle className="kidle-ring-value" cx="50" cy="50" r={RADIUS} strokeDasharray={CIRCUMFERENCE} />
          </svg>
          <span>{left}</span>
        </div>
        <h2 id="kidle-title">{copy.stillThere}</h2>
        <p id="kidle-lead">{copy.stillThereLead}</p>
        <p className="sr-only" aria-live="polite">{left % 5 === 0 ? copy.closingIn(left) : ''}</p>
        <div className="kiosk-card-actions">
          <button type="button" className="kiosk-primary" ref={continueRef} onClick={onContinue}>{copy.keepGoing}</button>
          <button type="button" className="kiosk-secondary" onClick={onEnd}>{copy.endNow}</button>
        </div>
      </div>
    </div>
  )
}

export default KioskIdle
