import { lazy, Suspense } from 'react'
import DashboardPage from './pages/DashboardPage'
import AppProviders from './components/providers/AppProviders'
import { kioskConfig } from './lib/kiosk'

// Chargée à part : le code de la borne n'alourdit pas l'application des usagers.
const KioskPage = lazy(() => import('./pages/KioskPage'))

// App retourne les providers globaux et la page principale : application personnelle ou borne d'accueil.
function App() {
  return (
    <AppProviders>
      {kioskConfig ? (
        <Suspense fallback={null}>
          <KioskPage config={kioskConfig} />
        </Suspense>
      ) : (
        <DashboardPage />
      )}
    </AppProviders>
  )
}

export default App
