import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/globals.css'
import App from './App'

// Point d'entrée Vite : on monte l'application React dans l'élément #root du fichier index.html.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
