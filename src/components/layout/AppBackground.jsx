import { useRef } from 'react'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'
import '../../css/AppBackground.css'

// Halo vert en mouvement lent derrière les surfaces en verre : il donne sa profondeur à l'effet glass.
function AppBackground() {
  const rootRef = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.utils.toArray('.bg-glow').forEach((glow) => {
        gsap.to(glow, {
          xPercent: gsap.utils.random(-22, 22),
          yPercent: gsap.utils.random(-16, 16),
          scale: gsap.utils.random(0.85, 1.2),
          duration: gsap.utils.random(14, 22),
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
      })
    })
    return () => mm.revert()
  }, { scope: rootRef })

  return (
    <div className="app-bg" ref={rootRef} aria-hidden="true">
      <span className="bg-glow bg-glow-a" />
      <span className="bg-glow bg-glow-b" />
      <span className="bg-glow bg-glow-c" />
      <span className="bg-vignette" />
    </div>
  )
}

export default AppBackground
