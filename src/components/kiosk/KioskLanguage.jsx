import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { kioskLanguages, languagePrompt } from '../../data/kioskCopy'
import { cn } from '../../lib/cn'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'
import Flag from '../voice/Flag'

// Première question de la visite : toute la suite est affichée (et écoutée) dans la langue choisie.
function KioskLanguage({ current, onSelect }) {
  const rootRef = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.klang-title > *', { y: 26, autoAlpha: 0, stagger: 0.1, duration: 0.7 })
        .from('.klang-card', { y: 50, autoAlpha: 0, scale: 0.94, stagger: 0.12, duration: 0.8, ease: 'back.out(1.4)' }, '-=0.35')
        .from('.klang-card .flag', { scale: 0.3, rotation: -25, stagger: 0.12, duration: 0.8, ease: 'back.out(2.2)' }, '<0.15')
    })
    return () => mm.revert()
  }, { scope: rootRef })

  return (
    <section className="kiosk-screen klang" ref={rootRef} aria-labelledby="klang-title">
      <h1 id="klang-title" className="klang-title">
        {languagePrompt.map((line) => <span key={line.lang} lang={line.lang}>{line.text}</span>)}
      </h1>
      <ul className="klang-list">
        {kioskLanguages.map((language) => (
          <li key={language.code}>
            <button
              type="button"
              className={cn('klang-card glass', current === language.code && 'is-current')}
              onClick={() => onSelect(language.code)}
              lang={language.code}
              aria-current={current === language.code || undefined}
            >
              <Flag code={language.flag} />
              <span className="klang-text">
                <strong>{language.name}</strong>
                <span>{language.tagline}</span>
              </span>
              <span className="klang-go" aria-hidden="true"><ArrowRight /></span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default KioskLanguage
