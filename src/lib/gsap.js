import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

// Enregistrement unique du hook React : tous les composants importent GSAP depuis ce module.
gsap.registerPlugin(useGSAP)
gsap.defaults({ ease: 'power3.out', duration: 0.6 })

// Les animations décoratives ne tournent que si l'utilisateur n'a pas demandé moins de mouvement.
export const MOTION_OK = '(prefers-reduced-motion: no-preference)'

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export { gsap, useGSAP }
