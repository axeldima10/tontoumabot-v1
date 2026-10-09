import { useRef } from 'react'
import { AudioLines, ChevronRight, Keyboard, QrCode, ShieldCheck } from 'lucide-react'
import botImage from '../../assets/images/tontuma-bot.png'
import { cn } from '../../lib/cn'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'

// Accueil de la borne : parler d'abord (accessible à tous), écrire ensuite, et les questions fréquentes.
function KioskHome({ copy, lang, canSpeak, topics, onSpeak, onWrite, onTopic, onPhone }) {
  const rootRef = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.khome-hello > *', { y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.7 })
        .from('.khome-action', { y: 40, autoAlpha: 0, scale: 0.96, stagger: 0.1, duration: 0.8 }, '-=0.4')
        .from('.khome-topics-title, .khome-topic', { y: 24, autoAlpha: 0, stagger: 0.05, duration: 0.55 }, '-=0.45')
        .from('.khome-foot', { autoAlpha: 0, duration: 0.6 }, '-=0.2')
      gsap.to('.khome-speak-wave span', {
        scaleY: 0.35, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: 0.12, from: 'center' },
      })
    })
    return () => mm.revert()
  }, { scope: rootRef })

  return (
    <section className="kiosk-screen khome" ref={rootRef} aria-labelledby="khome-title" lang={lang}>
      <div className="khome-hello">
        <img src={botImage} alt="" width="432" height="430" />
        <h1 id="khome-title">{copy.hello}</h1>
      </div>

      <div className={cn('khome-actions', !canSpeak && 'is-text-only')}>
        {canSpeak && (
          <button type="button" className="khome-action khome-speak" onClick={onSpeak}>
            <span className="khome-speak-wave" aria-hidden="true">
              <span /><span /><span /><span /><span />
            </span>
            <span className="khome-action-text">
              <strong>{copy.speak}</strong>
              <span>{copy.speakSub}</span>
            </span>
            <span className="khome-action-icon" aria-hidden="true"><AudioLines /></span>
          </button>
        )}
        <button type="button" className={cn('khome-action khome-write', canSpeak ? 'glass' : 'is-primary')} onClick={onWrite}>
          <span className="khome-action-icon" aria-hidden="true"><Keyboard /></span>
          <span className="khome-action-text">
            <strong>{copy.write}</strong>
            <span>{copy.writeSub}</span>
          </span>
        </button>
      </div>

      <div className="khome-topics">
        <h2 className="khome-topics-title">{copy.topics}</h2>
        <ul>
          {topics.map(({ id, icon: Icon, label }) => (
            <li key={id}>
              <button type="button" className="khome-topic glass" onClick={() => onTopic(label[lang])}>
                <span className="khome-topic-icon" aria-hidden="true"><Icon /></span>
                <span className="khome-topic-label">{label[lang]}</span>
                <ChevronRight className="khome-topic-chevron" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <footer className="khome-foot">
        <p><ShieldCheck aria-hidden="true" />{copy.privacy}</p>
        <button type="button" className="kiosk-pill glass" onClick={onPhone}>
          <QrCode aria-hidden="true" />
          {copy.phone}
        </button>
      </footer>
    </section>
  )
}

export default KioskHome
