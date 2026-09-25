import { useRef } from 'react'
import { AudioLines, Compass, FileCheck2, FileText, ListChecks, MapPin, MessageSquareText } from 'lucide-react'
import botImage from '../../assets/images/tontuma-bot.png'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'
import Flag from '../voice/Flag'

// Chaque illustration anime sa propre entrée au montage (la diapositive est remontée à chaque étape).

/** Écran 1 : la mascotte entourée de bulles dans les trois langues. */
export function MeetVisual() {
  const rootRef = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.meet-disc', { scale: 0.6, autoAlpha: 0, duration: 1, ease: 'expo.out' })
        .from('.meet-bot', { y: 50, scale: 0.8, autoAlpha: 0, duration: 1, ease: 'back.out(1.6)' }, '<0.1')
        .from('.meet-bubble', { scale: 0, autoAlpha: 0, duration: 0.55, stagger: 0.14, ease: 'back.out(2.2)' }, '-=0.5')

      gsap.to('.meet-float', { y: -12, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      gsap.to('.meet-ring', { rotation: 360, duration: 30, ease: 'none', repeat: -1 })
      // Chaque bulle flotte à son rythme, pour un mouvement vivant et jamais synchronisé.
      gsap.utils.toArray('.meet-bubble-float').forEach((bubble, index) => {
        gsap.to(bubble, { y: index % 2 ? 7 : -7, duration: 2.2 + index * 0.35, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      })
    })
    return () => mm.revert()
  }, { scope: rootRef })

  return (
    <div className="ob-visual meet" ref={rootRef} aria-hidden="true">
      <span className="meet-disc" />
      <span className="meet-ring" />
      <span className="meet-float">
        <img className="meet-bot" src={botImage} alt="" width="432" height="430" fetchPriority="high" />
      </span>
      <span className="meet-bubble-float is-a"><span className="meet-bubble is-light">Bonjour ! 👋</span></span>
      <span className="meet-bubble-float is-b"><span className="meet-bubble is-green" lang="wo">Na nga def ?</span></span>
      <span className="meet-bubble-float is-c"><span className="meet-bubble is-green">Comment puis-je vous aider ?</span></span>
      <span className="meet-bubble-float is-d"><span className="meet-bubble is-glass" lang="en">Hello!</span></span>
    </div>
  )
}

const guideSteps = [
  { icon: FileText, label: 'Démarches', example: 'Quels papiers pour un passeport ?' },
  { icon: MapPin, label: 'Orientation', example: 'Où se trouve le service de l’état civil ?' },
  { icon: ListChecks, label: 'Accompagnement', example: 'Aidez-moi à remplir ce formulaire.' },
]

/** Écran 2 : trois usages concrets reliés par un chemin, comme un parcours guidé. */
export function GuideVisual() {
  const rootRef = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      gsap.utils.toArray('.guide-step').forEach((step, index) => {
        const fromX = index % 2 ? 40 : -40
        tl.from(step.querySelector('.guide-chip'), { x: fromX, autoAlpha: 0, duration: 0.6, ease: 'back.out(1.6)' }, index * 0.45)
          .from(step.querySelector('.guide-card'), { y: 14, autoAlpha: 0, duration: 0.5 }, '<0.2')
      })
      // Le chemin se dessine entre les étapes (le masque plein révèle le trait pointillé).
      tl.fromTo('.guide-path-mask', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 0.3)
    })
    return () => mm.revert()
  }, { scope: rootRef })

  return (
    <div className="ob-visual guide" ref={rootRef} aria-hidden="true">
      <svg className="guide-path" viewBox="0 0 300 360" preserveAspectRatio="none">
        <defs>
          <mask id="guide-reveal">
            <path className="guide-path-mask" d="M250 70 C 310 120, 270 150, 150 165 S 20 230, 60 285" pathLength="1" strokeDasharray="1" />
          </mask>
        </defs>
        <path className="guide-path-line" d="M250 70 C 310 120, 270 150, 150 165 S 20 230, 60 285" mask="url(#guide-reveal)" />
      </svg>
      {guideSteps.map(({ icon: Icon, label, example }, index) => (
        <div className={`guide-step ${index % 2 ? 'is-right' : ''}`} key={label}>
          <span className="guide-chip"><Icon />{label}</span>
          <span className="guide-card glass">{example}</span>
        </div>
      ))}
    </div>
  )
}

const modes = [
  { icon: MessageSquareText, label: 'Discussion écrite' },
  { icon: AudioLines, label: 'Mode vocal', flags: true },
  { icon: FileCheck2, label: 'Démarches guidées' },
  { icon: Compass, label: 'Orientation' },
]

/** Écran 3 : les façons d'interagir, en tuiles de verre avec sphères lumineuses. */
export function ModesVisual() {
  const rootRef = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.mode-tile', { y: 36, scale: 0.9, autoAlpha: 0, duration: 0.7, stagger: { each: 0.1, grid: [2, 2], from: 'start' }, ease: 'back.out(1.5)' })
        .from('.mode-orb', { scale: 0.3, rotation: -30, duration: 0.7, stagger: 0.1, ease: 'back.out(2)' }, '<0.15')
      gsap.utils.toArray('.mode-orb').forEach((orb, index) => {
        gsap.to(orb, { y: -5, duration: 2 + index * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: index * 0.2 })
      })
    })
    return () => mm.revert()
  }, { scope: rootRef })

  return (
    <div className="ob-visual modes" ref={rootRef} aria-hidden="true">
      {modes.map(({ icon: Icon, label, flags }) => (
        <div className="mode-tile glass" key={label}>
          <span className="mode-orb"><Icon /></span>
          <strong>{label}</strong>
          {flags && (
            <span className="mode-flags">
              <Flag code="sn" />
              <Flag code="fr" />
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
