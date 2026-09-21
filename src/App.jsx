import DashboardPage from './pages/DashboardPage'
import AppProviders from './components/providers/AppProviders'

// App retourne les providers globaux et la page principale de l'application.
function App() {
  return (
    <AppProviders>
      <DashboardPage />
    </AppProviders>
  )
}

export default App
