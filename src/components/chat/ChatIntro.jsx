import { useRef } from 'react'
import botImage from '../../assets/images/tontuma-bot.png'
import { suggestions } from '../../data/dashboardData'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'

// Écran « Nouvelle discussion » : la mascotte occupe la scène et invite à écrire.
function ChatIntro({ firstName, onSuggestion }) {
  const rootRef = useRef(null)

  useGSAP((context, contextSafe) => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('.intro-stage', { scale: 0.6, autoAlpha: 0, duration: 1.1, ease: 'expo.out' })
        .from('.intro-bot', { y: 40, rotation: -8, duration: 1, ease: 'back.out(1.8)' }, '<0.1')
        .from('.intro-copy > *', { y: 18, autoAlpha: 0, stagger: 0.08, duration: 0.6 }, '-=0.6')
        .from('.intro-chip', { y: 14, autoAlpha: 0, stagger: 0.06, duration: 0.5 }, '-=0.35')

      gsap.to('.intro-float', { y: -14, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      gsap.to('.intro-shadow', { scaleX: 0.78, autoAlpha: 0.35, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      gsap.to('.intro-glow', { scale: 1.15, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      gsap.to('.intro-ring', { rotation: 360, duration: 26, ease: 'none', repeat: -1 })
    })

    // Sur ordinateur, la mascotte s'oriente légèrement vers le pointeur.
    mm.add(`${MOTION_OK} and (pointer: fine)`, () => {
      const bot = rootRef.current.querySelector('.intro-bot')
      const rotateY = gsap.quickTo(bot, 'rotationY', { duration: 0.8, ease: 'power3' })
      const rotateX = gsap.quickTo(bot, 'rotationX', { duration: 0.8, ease: 'power3' })
      const onMove = contextSafe((event) => {
        rotateY(gsap.utils.mapRange(0, window.innerWidth, -14, 14, event.clientX))
        rotateX(gsap.utils.mapRange(0, window.innerHeight, 10, -10, event.clientY))
      })
      window.addEventListener('pointermove', onMove, { passive: true })
      return () => window.removeEventListener('pointermove', onMove)
    })
    return () => mm.revert()
  }, { scope: rootRef })

  return (
    <div className="intro" ref={rootRef}>
      <div className="intro-stage" aria-hidden="true">
        <span className="intro-glow" />
        <span className="intro-ring" />
        <span className="intro-shadow" />
        <span className="intro-float">
          <img className="intro-bot" src={botImage} alt="" width="432" height="430" fetchPriority="high" />
        </span>
      </div>
      <div className="intro-copy">
        <p className="intro-hello">
          {firstName ? `${firstName}, je suis ` : 'Bonjour, je suis '}
          <span translate="no">Tontouma</span>
        </p>
        <h1>Comment <span className="nowrap">puis-je</span> vous aider&nbsp;?</h1>
        <p className="intro-sub">Posez votre question sur une démarche, un document ou un service. Je vous guide pas à pas.</p>
      </div>
      <ul className="intro-chips" aria-label="Suggestions">
        {suggestions.map(({ label, icon: Icon }) => (
          <li key={label}>
            <button type="button" className="intro-chip glass" onClick={() => onSuggestion(label)}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ChatIntro
