/**
 * Invitation à installer la PWA.
 *
 * Chrome / Edge / Android émettent `beforeinstallprompt` très tôt : on le capture dès le chargement
 * du module pour pouvoir proposer l'installation plus tard, au bon moment (après une première réponse).
 * Safari iOS n'a pas cet événement : on y affiche la marche à suivre (Partager → Sur l'écran d'accueil).
 */
const DISMISS_KEY = 'tontuma_install_dismissed_at'
const DISMISS_DAYS = 14

let deferredPrompt = null
let installed = false
const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Empêche la mini-barre native : l'invitation est affichée par l'application, au bon moment.
    event.preventDefault()
    deferredPrompt = event
    emit()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferredPrompt = null
    emit()
  })
}

export function subscribeInstall(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function isIosSafari() {
  const ua = window.navigator.userAgent
  const ios = /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
  return ios && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua)
}

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY))
    return Boolean(at) && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

/** 'prompt' (bouton Installer), 'ios' (instructions), ou null si rien à proposer. */
export function getInstallMode() {
  if (installed || isStandalone() || dismissedRecently()) return null
  if (deferredPrompt) return 'prompt'
  if (isIosSafari()) return 'ios'
  return null
}

export async function promptInstall() {
  if (!deferredPrompt) return false
  const promptEvent = deferredPrompt
  deferredPrompt = null
  promptEvent.prompt()
  const { outcome } = await promptEvent.userChoice
  if (outcome !== 'accepted') dismissInstall()
  emit()
  return outcome === 'accepted'
}

export function dismissInstall() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {
    // Sans stockage, l'invitation pourra réapparaître à la prochaine visite : sans gravité.
  }
  emit()
}
