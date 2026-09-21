// Clé utilisée par l'écran de connexion pour conserver temporairement le JWT.
// Le token ne doit jamais être écrit en dur dans le code source.
const ACCESS_TOKEN_KEY = 'tontuma_access_token'

/**
 * Retourne le JWT disponible pour les appels backend.
 *
 * Le service essaie d'abord sessionStorage, puis localStorage afin de fonctionner
 * avec une session temporaire ou une session persistante. Quand l'authentification
 * sera branchée, l'écran de connexion devra simplement écrire cette même clé.
 */
export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY) || ''
}

/** Enregistre le token après une connexion réussie. */
export function saveAccessToken(token, { remember = false } = {}) {
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(ACCESS_TOKEN_KEY, token)
}

/** Supprime le token lors de la déconnexion. */
export function clearAccessToken() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}
