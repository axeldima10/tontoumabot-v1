import { useRef } from 'react'
import { cn } from '../../lib/cn'
import { gsap, MOTION_OK, prefersReducedMotion, useGSAP } from '../../lib/gsap'

/**
 * Sphère de verre verte. Chaque couche porte une seule animation pour éviter les conflits de transform :
 * .orb (entrée) > .orb-react (volume du micro) > .orb-core (respiration) > tourbillons (rotation).
 */
function VoiceOrb({ analyserRef, listening, speaking }) {
  const rootRef = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.from('.orb', { scale: 0.55, autoAlpha: 0, duration: 1.3, ease: 'expo.out' })
      gsap.to('.orb-swirl-a', { rotation: 360, duration: 16, ease: 'none', repeat: -1 })
      gsap.to('.orb-swirl-b', { rotation: -360, duration: 24, ease: 'none', repeat: -1 })
      gsap.to('.orb-swirl-c', { rotation: 360, duration: 34, ease: 'none', repeat: -1 })
      gsap.to('.orb-core', { scale: 1.035, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    })
    return () => mm.revert()
  }, { scope: rootRef })

  // Pendant l'écoute, le volume du micro pilote la taille et la lueur de la sphère.
  useGSAP(() => {
    const analyser = analyserRef.current
    if (!listening || !analyser || prefersReducedMotion()) return undefined

    const reactEl = rootRef.current.querySelector('.orb-react')
    const glowEl = rootRef.current.querySelector('.orb-aura')
    const scaleTo = gsap.quickTo(reactEl, 'scale', { duration: 0.22, ease: 'power3' })
    const glowTo = gsap.quickTo(glowEl, 'opacity', { duration: 0.3, ease: 'power2' })
    const samples = new Uint8Array(analyser.fftSize)

    const tick = () => {
      analyser.getByteTimeDomainData(samples)
      let sum = 0
      for (let i = 0; i < samples.length; i += 1) {
        const value = (samples[i] - 128) / 128
        sum += value * value
      }
      const level = Math.min(1, Math.sqrt(sum / samples.length) * 4)
      scaleTo(1 + level * 0.14)
      glowTo(0.45 + level * 0.55)
    }

    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, { dependencies: [listening], scope: rootRef, revertOnUpdate: true })

  return (
    <div className={cn('orb-wrap', listening && 'is-listening', speaking && 'is-speaking')} ref={rootRef} aria-hidden="true">
      <span className="orb-aura" />
      <div className="orb">
        <div className="orb-react">
          <div className="orb-core">
            <span className="orb-swirl orb-swirl-a" />
            <span className="orb-swirl orb-swirl-b" />
            <span className="orb-swirl orb-swirl-c" />
            <span className="orb-gloss" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceOrb
