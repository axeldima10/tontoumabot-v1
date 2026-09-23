import { useCallback, useSyncExternalStore } from 'react'

// Abonnement réactif à une media query, sans lecture de layout pendant le rendu.
function useMediaQuery(query) {
  const subscribe = useCallback((callback) => {
    const list = window.matchMedia(query)
    list.addEventListener('change', callback)
    return () => list.removeEventListener('change', callback)
  }, [query])

  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}

export default useMediaQuery
