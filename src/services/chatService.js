 // URL du relais Java Spring Boot pour le mode texte.
// En développement, Vite peut utiliser un proxy avec le chemin /api/chat/stream.
const TEXT_SESSION_URL = import.meta.env.VITE_TEXT_SESSION_URL || '/api/chat/stream'

/**
 * Consomme une réponse Server-Sent Events envoyée par le backend Java.
 *
 * Le backend doit répondre avec "Content-Type: text/event-stream" et envoyer
 * des événements séparés par une ligne vide : "data: Bonjour\\n\\n".
 * La fonction retourne une fonction d'annulation pour interrompre la requête.
 *
 * @param {string} questionText Question envoyée au backend.
 * @param {(chunk: string) => void} onChunkReceived Callback appelé pour chaque chunk.
 * @param {(error: Error) => void} onError Callback appelé en cas d'erreur réseau.
 * @param {string} accessToken JWT facultatif utilisé pour authentifier la requête.
 * @param {() => void} onComplete Appelé lorsque le serveur ferme normalement le flux.
 * @returns {() => void} Fonction qui annule le flux en cours.
 */
export function streamTextSession(questionText, onChunkReceived, onError, accessToken = '', onComplete) {
  // Chaque appel possède son propre contrôleur : aucune requête n'est partagée
  // entre les composants ou les sessions utilisateur.
  const controller = new AbortController()
  let cancelled = false

  const reportError = (error) => {
    // Une annulation volontaire ne doit pas être affichée comme une erreur utilisateur.
    if (!cancelled && error.name !== 'AbortError') onError?.(error)
  }

  const consumeStream = async () => {
    try {
      // POST permet d'envoyer la question tout en recevant une réponse progressive.
      const headers = {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      }

      // Le header est ajouté seulement lorsqu'un token est disponible, ce qui
      // permet aussi de tester le front avec un backend local non authentifié.
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`

      const response = await fetch(TEXT_SESSION_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question: questionText }),
        signal: controller.signal,
      })

      // fetch ne rejette pas automatiquement les réponses HTTP 4xx ou 5xx.
      if (!response.ok) {
        throw new Error(`Le serveur texte a répondu avec le statut ${response.status}.`)
      }

      if (!response.body) {
        throw new Error('Le serveur texte n’a pas fourni de flux lisible.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (!cancelled) {
        const { value, done } = await reader.read()
        if (done) break

        // Un chunk réseau peut couper une ligne SSE au milieu : on conserve donc
        // la partie incomplète dans buffer jusqu'à la réception suivante.
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split(/\r?\n\r?\n/)
        buffer = events.pop() || ''

        events.forEach((event) => {
          const data = event
            .split(/\r?\n/)
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trimStart())
            .join('\n')

          // Les lignes vides et l'événement de fin SSE ne sont pas transmis à React.
          if (data && data !== '[DONE]') onChunkReceived(data)
        })
      }

      // Vide les derniers octets UTF-8 restés dans le décodeur.
      buffer += decoder.decode()
      if (buffer.trim()) onChunkReceived(buffer.trim())
      if (!cancelled) onComplete?.()
    } catch (error) {
      reportError(error)
    }
  }

  // On démarre la consommation sans bloquer le composant appelant.
  consumeStream()

  // Le composant peut appeler cette fonction lors d'un démontage ou d'un nouveau message.
  return () => {
    cancelled = true
    controller.abort()
  }
}
