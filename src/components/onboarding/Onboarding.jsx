import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import botImage from '../../assets/images/tontuma-bot.png'
import { cn } from '../../lib/cn'
import { gsap, MOTION_OK, prefersReducedMotion, useGSAP } from '../../lib/gsap'
import { GuideVisual, MeetVisual, ModesVisual } from './OnboardingVisuals'
import '../../css/Onboarding.css'

const slides = [
  {
    kicker: 'Bienvenue',
    title: 'Rencontrez Tontouma, votre assistant d’accueil',
    text: 'Je vous accueille, vous oriente et vous accompagne dans vos démarches administratives, à toute heure.',
    Visual: MeetVisual,
  },
  {
    kicker: 'Démarches',
    title: 'Des réponses claires, étape par étape',
    text: 'Documents, délais, lieux : posez vos questions comme à un agent d’accueil. Je transforme les procédures complexes en étapes simples.',
    Visual: GuideVisual,
  },
  {
    kicker: 'À votre façon',
    title: 'Écrivez ou parlez, en wolof ou en français',
    text: 'Passez de l’écrit à la voix sans perdre le fil de la conversation.',
    Visual: ModesVisual,
  },
]

const SWIPE_DISTANCE = 50
// Les illustrations sont dessinées sur un carré de 360 px, puis mises à l'échelle de la place disponible.
const DESIGN_SIZE = 360
const STAGE_GUTTER = 24

// Présentation en trois étapes, toujours passable, qui mène directement au service (sans compte).
function Onboarding({ onDone, onSignIn }) {
  const rootRef = useRef(null)
  const [index, setIndex] = useState(0)
  const directionRef = useRef(1)
  const busyRef = useRef(false)
  const swipeRef = useRef(null)
  const stageRef = useRef(null)
  const slide = slides[index]
  const last = index === slides.length - 1
  const { Visual } = slide

  const { contextSafe } = useGSAP({ scope: rootRef })

  // Petit écran : l'illustration rétrécit au lieu de déborder sur le texte ; grand écran : elle grandit.
  useLayoutEffect(() => {
    const stage = stageRef.current
    const update = () => {
      const maxFit = window.innerWidth >= 1024 ? 1.45 : 1.1
      const fit = Math.min(
        (stage.clientWidth - STAGE_GUTTER) / DESIGN_SIZE,
        (stage.clientHeight - STAGE_GUTTER) / DESIGN_SIZE,
        maxFit,
      )
      stage.style.setProperty('--fit', Math.max(0.45, fit).toFixed(3))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  // Entrée de chaque étape : le texte glisse dans le sens de la navigation.
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const offset = directionRef.current * 36
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .fromTo('.ob-copy > *', { x: offset, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, stagger: 0.07 })
        .fromTo('.ob-stage', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0)
    })
    return () => mm.revert()
  }, { dependencies: [index], scope: rootRef, revertOnUpdate: true })

  // Première apparition : la marque et les commandes arrivent après l'illustration.
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      // clearProps : aucun style en ligne ne doit subsister (sinon « Passer » resterait visible à la dernière étape).
      gsap.from('.ob-top > *, .ob-actions', { y: 16, autoAlpha: 0, duration: 0.7, stagger: 0.08, delay: 0.5, ease: 'power3.out', clearProps: 'transform,opacity,visibility' })
    })
    return () => mm.revert()
  }, { scope: rootRef })

  const goTo = contextSafe((next) => {
    if (next < 0 || next >= slides.length || next === index || busyRef.current) return
    directionRef.current = next > index ? 1 : -1
    if (prefersReducedMotion()) {
      setIndex(next)
      return
    }
    busyRef.current = true
    // Sortie rapide de l'étape courante avant d'afficher la suivante.
    gsap.to('.ob-stage, .ob-copy', {
      autoAlpha: 0,
      x: -directionRef.current * 30,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set('.ob-stage, .ob-copy', { clearProps: 'x,opacity,visibility' })
        busyRef.current = false
        setIndex(next)
      },
    })
  })

  const finish = contextSafe(() => {
    if (busyRef.current) return
    if (prefersReducedMotion()) {
      onDone()
      return
    }
    busyRef.current = true
    gsap.to(rootRef.current, { autoAlpha: 0, scale: 1.04, duration: 0.45, ease: 'power2.in', onComplete: onDone })
  })

  const next = () => (last ? finish() : goTo(index + 1))

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target.closest?.('input, textarea')) return
      if (event.key === 'ArrowRight') goTo(index + 1)
      if (event.key === 'ArrowLeft') goTo(index - 1)
      if (event.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [index, goTo, finish])

  // Balayage horizontal sur mobile (le défilement vertical reste natif).
  function onPointerDown(event) {
    swipeRef.current = { x: event.clientX, y: event.clientY }
  }

  function onPointerUp(event) {
    const start = swipeRef.current
    swipeRef.current = null
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy)) return
    goTo(index + (dx < 0 ? 1 : -1))
  }

  return (
    <div className="onboarding" ref={rootRef}>
      <header className="ob-top">
        <span className="ob-brand">
          <img src={botImage} alt="" width="432" height="430" />
          <span translate="no">TONTOUMA-BOT</span>
        </span>
        {/* Masqué par visibility sur la dernière étape : ni visible, ni atteignable au clavier. */}
        <button type="button" className={cn('ob-skip', last && 'is-hidden')} onClick={finish}>
          Passer
        </button>
      </header>

      <main
        className="ob-body"
        aria-roledescription="carrousel"
        aria-label="Présentation de Tontouma"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { swipeRef.current = null }}
      >
        <div className="ob-stage" ref={stageRef}>
          <div className="ob-fit" key={`visual-${index}`}>
            <Visual />
          </div>
        </div>

        <section
          className="ob-panel"
          aria-roledescription="diapositive"
          aria-label={`${index + 1} sur ${slides.length}`}
        >
          <div className="ob-copy" key={`copy-${index}`}>
            <p className="kicker">{slide.kicker}</p>
            <h1>{slide.title}</h1>
            <p className="ob-text">{slide.text}</p>
          </div>

          <div className="ob-actions">
            <div className="ob-progress" role="group" aria-label={`Étape ${index + 1} sur ${slides.length}`}>
              {slides.map((item, dot) => (
                <button
                  type="button"
                  key={item.kicker}
                  className={cn('ob-dot', dot <= index && 'is-done', dot === index && 'is-current')}
                  onClick={() => goTo(dot)}
                  aria-label={`Aller à l’étape ${dot + 1} : ${item.kicker}`}
                  aria-current={dot === index ? 'step' : undefined}
                >
                  <span />
                </button>
              ))}
            </div>

            <div className="ob-buttons">
              {index > 0 && (
                <button type="button" className="glass-btn ob-back" onClick={() => goTo(index - 1)} aria-label="Étape précédente">
                  <ArrowLeft aria-hidden="true" />
                </button>
              )}
              <button type="button" className="ob-next" onClick={next}>
                {last ? 'Commencer' : 'Continuer'}
                <ArrowRight aria-hidden="true" />
              </button>
            </div>
            <p className={cn('ob-note', !last && 'is-hidden')}>
              Gratuit, sans inscription. Vous avez un compte ?{' '}
              <button type="button" onClick={onSignIn} tabIndex={last ? 0 : -1}>Se connecter</button>
            </p>
          </div>
        </section>
      </main>

      <p className="sr-only" aria-live="polite">{`Étape ${index + 1} sur ${slides.length} : ${slide.title}`}</p>
    </div>
  )
}

export default Onboarding
