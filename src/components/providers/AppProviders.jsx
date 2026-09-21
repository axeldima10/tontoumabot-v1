import { ThemeProvider } from '../../context/ThemeContext'

// Centralise les providers afin que App.jsx reste simple lorsque l'application grandira.
function AppProviders({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

export default AppProviders
