import { useRef } from 'react'
import botImage from '../../assets/images/tontuma-bot.png'
import { attractSlides } from '../../data/kioskCopy'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'

const SLIDE_SECONDS = 3.2
const bubbles = [
  { text: 'Na nga def ?', lang: 'wo' },
  { text: 'Bonjour !', lang: 'fr' },
  { text: 'Hello!', lang: 'en' },
  { text: 'Salaamaalekum', lang: 'wo' },
]

// Écran de veille : le robot attire l'œil de loin, les salutations défilent dans les trois langues.
function KioskAttract({ onStart }) {
  const rootRef = useRef(null)

  useGSAP(() => {
    const slides = gsap.utils.toArray('.attract-slide')
    const mm = gsap.matchMedia()

    mm.add(MOTION_OK, () => {
      gsap.from('.attract-bot', { scale: 0.6, autoAlpha: 0, duration: 1.4, ease: 'expo.out' })
      gsap.to('.attract-float', { y: -18, rotation: 2, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      gsap.to('.attract-ring', { scale: 1.08, autoAlpha: 0.35, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.6 })
      gsap.utils.toArray('.attract-bubble').forEach((bubble, index) => {
        gsap.fromTo(bubble,
          { autoAlpha: 0, scale: 0.6, y: 20 },
          { autoAlpha: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.8)', delay: 0.6 + index * 0.35 })
        gsap.to(bubble, { y: '+=12', duration: 2.4 + index * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.6 + index * 0.35 })
      })
      gsap.to('.attract-touch', { scale: 1.04, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1 })

      // Les langues défilent en fondu, en boucle.
      gsap.set(slides, { autoAlpha: 0, y: 24 })
      const tl = gsap.timeline({ repeat: -1 })
      slides.forEach((slide) => {
        tl.to(slide, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' })
          .to(slide, { autoAlpha: 0, y: -24, duration: 0.6, ease: 'power2.in' }, `+=${SLIDE_SECONDS}`)
      })
    })

    // Sans animation : seule la première langue reste affichée.
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(slides, { autoAlpha: 0 })
      gsap.set(slides[0], { autoAlpha: 1 })
    })
    return () => mm.revert()
  }, { scope: rootRef })

  return (
    <button type="button" className="kiosk-attract" ref={rootRef} onClick={onStart} aria-label="Toucher pour commencer · Laal ngir tàmbali · Touch to start">
      <span className="attract-brand">
        <img src={botImage} alt="" width="432" height="430" />
        <span translate="no">TONTOUMA-BOT</span>
      </span>

      <span className="attract-bot" aria-hidden="true">
        <span className="attract-ring attract-ring-a" />
        <span className="attract-ring attract-ring-b" />
        <span className="attract-float">
          <img src={botImage} alt="" width="432" height="430" />
        </span>
        {bubbles.map((bubble, index) => (
          <span key={bubble.text} className={`attract-bubble glass attract-bubble-${index + 1}`} lang={bubble.lang}>{bubble.text}</span>
        ))}
      </span>

      <span className="attract-slides" aria-hidden="true">
        {attractSlides.map((slide) => (
          <span key={slide.lang} className="attract-slide" lang={slide.lang}>
            <span className="attract-greeting">{slide.greeting}</span>
            <span className="attract-touch">{slide.touch}</span>
          </span>
        ))}
      </span>

      <span className="attract-foot" aria-hidden="true">
        <span>Wolof</span>
        <span>Français</span>
        <span>English</span>
      </span>
    </button>
  )
}

export default KioskAttract
