// URL de base du serveur Python FastAPI.
// Le protocole sécurisé est nécessaire lorsque le front est servi en HTTPS.
const VOICE_SOCKET_URL = import.meta.env.VITE_VOICE_SOCKET_URL || 'wss://tontoumabot.com'

// Ce service ne porte pas d'état métier React : il conserve uniquement la
// connexion WebSocket technique afin de pouvoir envoyer et fermer le tunnel.
export const voiceSocketService = {
  socket: null,

  /**
   * Ouvre le tunnel audio vers FastAPI.
   *
   * jwtToken peut être :
   * - un chemin déjà construit, par exemple "/ws/audio?token=..." ;
   * - un token brut, converti en query string "?token=...".
   *
   * @param {string} jwtToken Jeton ou suffixe d'URL fourni par l'authentification.
   * @param {(audioBlob: Blob) => void} onAudioReceived Callback audio entrant.
   * @param {(error: Error) => void} onError Callback d'erreur réseau.
   * @returns {WebSocket} Connexion ouverte ou en cours d'ouverture.
   */
  connect(jwtToken, onAudioReceived, onError) {
    // Une seule connexion audio active à la fois évite d'envoyer le micro
    // vers une ancienne session restée ouverte.
    this.disconnect()

    const tokenPart = jwtToken
      ? (jwtToken.startsWith('/') ? jwtToken : `?token=${encodeURIComponent(jwtToken)}`)
      : ''
    const socket = new WebSocket(`${VOICE_SOCKET_URL}${tokenPart}`)
    this.socket = socket
    socket.binaryType = 'blob'

    socket.onmessage = (event) => {
      // Le serveur doit envoyer des octets audio. Blob est le format attendu
      // par le navigateur pour créer ensuite une source audio lisible.
      const audioBlob = event.data instanceof Blob ? event.data : new Blob([event.data])
      onAudioReceived?.(audioBlob)
    }

    socket.onerror = () => {
      onError?.(new Error('La connexion audio WebSocket a rencontré une erreur.'))
    }

    socket.onclose = () => {
      if (this.socket === socket) this.socket = null
    }

    return socket
  },

  /** Envoie le Blob audio brut, sans enveloppe JSON. */
  sendAudioChunk(blob) {
    if (!(blob instanceof Blob)) {
      throw new TypeError('sendAudioChunk attend un Blob audio.')
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('La connexion audio WebSocket n’est pas ouverte.')
    }

    this.socket.send(blob)
  },

  /** Ferme le tunnel avec le code normal 1000 lorsque la session se termine. */
  disconnect() {
    if (!this.socket) return

    this.socket.onclose = null
    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
      this.socket.close(1000, 'Connexion terminée par le client')
    }
    this.socket = null
  },
}