// Mode borne : une seule application, deux usages. La borne se déclare par son adresse :
//   /?mode=borne&borne=HALL-01&org=<organizationId>
// La configuration est mémorisée sur la machine pour survivre aux rechargements ; /?mode=app la retire.
const KIOSK_KEY = 'tontuma_kiosk_v1'

function readKioskConfig() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode')

  if (mode === 'app') {
    try {
      localStorage.removeItem(KIOSK_KEY)
    } catch {
      // Stockage indisponible : rien n'avait pu être mémorisé.
    }
    return null
  }

  if (mode === 'borne' || mode === 'kiosk') {
    const config = { borneId: params.get('borne') || '', organizationId: params.get('org') || '' }
    try {
      localStorage.setItem(KIOSK_KEY, JSON.stringify(config))
    } catch {
      // Sans stockage, le mode reste actif tant que l'adresse contient ?mode=borne.
    }
    return config
  }

  try {
    const stored = JSON.parse(localStorage.getItem(KIOSK_KEY))
    return stored && typeof stored === 'object' ? stored : null
  } catch {
    return null
  }
}

// Lu une seule fois au chargement : le mode ne change pas pendant la vie de la page.
export const kioskConfig = readKioskConfig()

// Lien encodé dans le QR code « Continuer sur mon téléphone » : l'application publique, sans paramètre de borne.
export const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL || (typeof window === 'undefined' ? '' : `${window.location.origin}/`)
