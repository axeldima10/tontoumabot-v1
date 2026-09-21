import { createContext, useContext, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

// Le contexte rend l'état du thème disponible à tous les composants sans prop drilling.
export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true)
  const toggleTheme = () => setDark((current) => !current)
  const value = useMemo(() => ({ dark, toggleTheme }), [dark])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Hook d'accès au thème : l'erreur aide à repérer un composant placé hors du provider.
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
