import { useCallback, useSyncExternalStore } from 'react'

// Chaque vue possède sa propre URL : l'utilisateur peut partager, recharger ou revenir en arrière.
export const viewHref = {
  home: '#accueil',
  chat: '#discussion',
  voice: '#vocal',
}

const viewByHash = {
  '#accueil': 'home',
  '#discussion': 'chat',
  '#vocal': 'voice',
}

// Sans ancre, l'application s'ouvre sur le mode vocal : c'est l'usage principal.
const DEFAULT_VIEW = 'voice'

function readView() {
  return viewByHash[window.location.hash] ?? DEFAULT_VIEW
}

function subscribe(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function useHashView() {
  const view = useSyncExternalStore(subscribe, readView, () => DEFAULT_VIEW)

  const navigate = useCallback((nextView) => {
    const hash = viewHref[nextView]
    if (hash && window.location.hash !== hash) window.location.hash = hash
  }, [])

  return [view, navigate]
}

export default useHashView
