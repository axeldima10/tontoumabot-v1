import { useRef } from 'react'
import { ShieldCheck } from 'lucide-react'
import botImage from '../../assets/images/tontuma-bot.png'
import { useCountdown } from '../../hooks/useIdle'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'
import { publicAppUrl } from '../../lib/kiosk'
import KioskQr from './KioskQr'

const SECONDS = 25

// Fin de visite : remerciement, preuve que tout est effacé, et le QR code pour repartir avec Tontouma.
function KioskEnd({ copy, lang, onRestart }) {
  const rootRef = useRef(null)
  const left = useCountdown(SECONDS, onRestart)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.kend-bot', { scale: 0.5, rotation: -12, autoAlpha: 0, duration: 1, ease: 'back.out(1.8)' })
        .from('.kend-copy > *', { y: 24, autoAlpha: 0, stagger: 0.1, duration: 0.7 }, '-=0.5')
        .from('.kend-qr', { y: 40, scale: 0.94, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.4)' }, '-=0.4')
        .from('.kend-actions > *', { y: 20, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, '-=0.3')
      gsap.to('.kend-bot img', { y: -12, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    })
    return () => mm.revert()
  }, { scope: rootRef })

  return (
    <section className="kiosk-screen kend" ref={rootRef} aria-labelledby="kend-title" lang={lang}>
      <span className="kend-bot" aria-hidden="true">
        <img src={botImage} alt="" width="432" height="430" />
      </span>
      <div className="kend-copy">
        <h1 id="kend-title">{copy.thanks}</h1>
        <p><ShieldCheck aria-hidden="true" />{copy.erased}</p>
      </div>
      <div className="kend-qr glass">
        <div className="kiosk-qr-frame">
          <KioskQr value={publicAppUrl} label={copy.qrTitle} />
        </div>
        <div>
          <h2>{copy.qrTitle}</h2>
          <p>{copy.qrLead}</p>
        </div>
      </div>
      <div className="kend-actions">
        <button type="button" className="kiosk-primary" onClick={onRestart}>{copy.newVisit}</button>
        <p aria-live="off">{copy.backIn(left)}</p>
      </div>
    </section>
  )
}

export default KioskEnd
