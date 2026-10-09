// Présentation affichée une seule fois par appareil (PWA : aucune barrière avant d'utiliser le service).
const ONBOARDING_KEY = 'tontuma_onboarding_v1'

/**
 * Visible au tout premier passage, à l'ouverture de l'application (sans ancre, ou ancienne adresse #accueil).
 * Un lien direct vers la discussion ou le mode vocal mène directement au service :
 * on ne bloque pas une intention déjà exprimée.
 */
export function shouldShowOnboarding() {
  try {
    if (localStorage.getItem(ONBOARDING_KEY) === 'done') return false
  } catch {
    // Sans stockage, on ne pourrait pas s'en souvenir : mieux vaut ne pas la répéter à chaque visite.
    return false
  }
  return window.location.hash === '' || window.location.hash === '#accueil'
}

export function markOnboardingDone() {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'done')
  } catch {
    // Préférence non mémorisée (navigation privée) : sans conséquence.
  }
}
