import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart']

/**
 * Appelle `onIdle` après `timeout` ms sans toucher l'écran ni le clavier.
 * Désactivé (`enabled: false`) pendant qu'une réponse est en cours ou qu'une alerte est déjà ouverte.
 */
export function useIdle({ enabled, timeout, onIdle }) {
  const onIdleRef = useRef(onIdle)

  useLayoutEffect(() => {
    onIdleRef.current = onIdle
  })

  useEffect(() => {
    if (!enabled) return undefined
    let timer
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => onIdleRef.current(), timeout)
    }
    ACTIVITY_EVENTS.forEach((type) => window.addEventListener(type, arm, { passive: true }))
    arm()
    return () => {
      clearTimeout(timer)
      ACTIVITY_EVENTS.forEach((type) => window.removeEventListener(type, arm))
    }
  }, [enabled, timeout])
}

/** Compte à rebours en secondes ; `onEnd` est appelé une fois arrivé à zéro. */
export function useCountdown(seconds, onEnd) {
  const [left, setLeft] = useState(seconds)
  const onEndRef = useRef(onEnd)

  useLayoutEffect(() => {
    onEndRef.current = onEnd
  })

  useEffect(() => {
    const started = Date.now()
    const timer = setInterval(() => {
      const remaining = Math.max(0, seconds - Math.floor((Date.now() - started) / 1000))
      setLeft(remaining)
      if (remaining === 0) {
        clearInterval(timer)
        onEndRef.current()
      }
    }, 250)
    return () => clearInterval(timer)
  }, [seconds])

  return left
}
