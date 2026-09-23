import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)
const PREFS_KEY = 'tontuma_prefs_v1'

// Les préférences d'affichage sont un simple confort : leur lecture ne doit jamais bloquer l'application.
function readPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}
  } catch {
    return {}
  }
}

// Le contexte rend l'état du thème disponible à tous les composants sans prop drilling.
export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => readPrefs().dark ?? true)

  useEffect(() => {
    // Le document entier suit le thème : barres de défilement, fond de rebond et barre du navigateur.
    const root = document.documentElement
    root.dataset.theme = dark ? 'dark' : 'light'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#050d09' : '#eef5f1')
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ dark }))
    } catch {
      // Stockage indisponible (navigation privée) : les préférences restent en mémoire.
    }
  }, [dark])

  const value = useMemo(() => ({
    dark,
    toggleTheme: () => setDark((current) => !current),
  }), [dark])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Hook d'accès au thème : l'erreur aide à repérer un composant placé hors du provider.
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
