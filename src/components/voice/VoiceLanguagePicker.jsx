import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { voiceLanguages } from '../../data/voiceLanguages'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'
import Flag from './Flag'

// Étape 1 du mode vocal : le moteur de transcription dépend de la langue choisie.
function VoiceLanguagePicker({ onSelect }) {
  const rootRef = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.lang-intro > *', { y: 20, autoAlpha: 0, stagger: 0.08, duration: 0.7 })
        .from('.lang-card', { y: 36, autoAlpha: 0, scale: 0.95, stagger: 0.12, duration: 0.8, ease: 'back.out(1.4)' }, '-=0.4')
        .from('.lang-card .flag', { scale: 0.4, rotation: -20, stagger: 0.12, duration: 0.7, ease: 'back.out(2)' }, '<0.15')
        .from('.lang-note', { autoAlpha: 0, duration: 0.6 }, '-=0.3')
    })
    return () => mm.revert()
  }, { scope: rootRef })

  return (
    <section className="lang-picker" ref={rootRef} aria-labelledby="lang-title">
      <div className="lang-intro">
        <p className="kicker">Mode vocal</p>
        <h1 id="lang-title">Dans quelle langue souhaitez-vous parler&nbsp;?</h1>
        <p>Je règle mon écoute sur votre langue pour bien vous comprendre.</p>
      </div>
      <ul className="lang-list">
        {voiceLanguages.map((language) => (
          <li key={language.code}>
            <button type="button" className="lang-card glass" onClick={() => onSelect(language.code)} lang={language.code}>
              <Flag code={language.flag} />
              <span className="lang-text">
                <strong>{language.name}</strong>
                <span>{language.greeting}</span>
              </span>
              <span className="lang-go" aria-hidden="true"><ArrowRight /></span>
            </button>
          </li>
        ))}
      </ul>
      <p className="lang-note">Vous pourrez changer de langue à tout moment.</p>
    </section>
  )
}

export default VoiceLanguagePicker
