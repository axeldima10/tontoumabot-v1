# Contrat backend TONTUMA-BOT

Ce document décrit ce que le front attend des backends Java et Python. Les deux
canaux sont séparés car le texte et la voix n'ont pas le même protocole ni le
même cycle de vie.

## 1. Backend Java : session texte SSE

### Endpoint attendu

```http
POST /api/chat/stream
Accept: text/event-stream
Content-Type: application/json
Authorization: Bearer <jwt>
```

# Moi côté Front
Le front utilise la variable `VITE_TEXT_SESSION_URL` pour remplacer cette URL.

### Requête

```json
{
  "question": "Je souhaite connaître les documents nécessaires",
  "language": "fr",
  "sessionId": "session-uuid-optionnel"
}
```

Le champ `question` est obligatoire. `language` et `sessionId` peuvent être
ajoutés au service lorsque l'authentification et la gestion de session seront
finalisées.

### Réponse

La réponse doit avoir les headers suivants :

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream;charset=UTF-8
Cache-Control: no-cache
Connection: keep-alive
```

Chaque événement doit être séparé par une ligne vide :

```text
data: Bonjour

data: , voici

data: les documents nécessaires.

data: [DONE]

```

Le front appelle `onChunkReceived` pour chaque valeur `data:`. `[DONE]` est un
marqueur technique et n'est pas affiché.

Si le backend envoie du JSON dans `data:`, il faut convenir d'un format stable,
par exemple :

```text
data: {"type":"chunk","content":"Bonjour"}

```

Dans ce cas, le service front devra parser ce JSON au lieu de traiter la valeur
comme une chaîne simple.

### Erreurs texte

Les erreurs doivent utiliser des statuts HTTP explicites :

- `400` : question absente ou invalide ;
- `401` : JWT absent ou invalide ;
- `403` : utilisateur non autorisé ;
- `429` : limite de requêtes atteinte ;
- `500` : erreur interne ;
- `503` : moteur conversationnel indisponible.

Le corps d'erreur devrait suivre un format constant :

```json
{
  "code": "CHAT_PROVIDER_UNAVAILABLE",
  "message": "Le service conversationnel est temporairement indisponible.",
  "requestId": "request-uuid"
}
```

## 2. Backend Python FastAPI : WebSocket vocal

### URL attendue

```text
wss://tontoumabot.com/ws/audio?token=<jwt>
```

Le front utilise `VITE_VOICE_SOCKET_URL` pour définir la base. Le chemin WebSocket
exact doit être confirmé par l'équipe Python. Le front ne peut pas envoyer un
header `Authorization` personnalisé pendant le handshake WebSocket standard ;
le token doit donc être accepté dans la query string, dans un cookie sécurisé,
ou via un mécanisme de handshake documenté.

### Sens front vers Python

Le navigateur capture le microphone avec `MediaRecorder`. Chaque événement
`dataavailable` doit être envoyé comme paquet binaire brut :

```text
Blob audio binaire
```

Il ne faut pas envelopper le Blob dans JSON. Le backend doit documenter le codec
attendu, par exemple `audio/webm;codecs=opus`, `audio/ogg;codecs=opus` ou PCM.

### Sens Python vers front

Pour chaque résultat audio, Python renvoie un message binaire contenant les
octets audio lisibles par le navigateur. Le front le transforme en `Blob` et
appelle `onAudioReceived(audioBlob)`.

Il faut confirmer :

- le codec retourné ;
- le sample rate ;
- si le retour est de l'audio généré ou de la transcription ;
- si les paquets sont autonomes ou doivent être concaténés ;
- le marqueur de fin de réponse.

### Messages de contrôle

Si des messages JSON sont nécessaires pour le contrôle, ils doivent être
réservés aux événements de contrôle et ne pas remplacer les paquets audio :

```json
{
  "type": "session.ready",
  "sessionId": "voice-session-uuid"
}
```

```json
{
  "type": "session.error",
  "code": "AUDIO_CODEC_UNSUPPORTED",
  "message": "Le codec reçu n'est pas supporté."
}
```

### Fermeture et erreurs

Le serveur doit utiliser des codes WebSocket compréhensibles :

- `1000` : fermeture normale ;
- `1008` : token invalide ou autorisation refusée ;
- `1011` : erreur interne ;
- `1013` : service temporairement indisponible.

Le serveur doit pouvoir fermer la connexion après un délai d'inactivité et
retourner une raison exploitable pour le diagnostic.

## 3. Sécurité et infrastructure

Les équipes backend doivent aussi fournir :

- les URLs de développement, recette et production ;
- la méthode d'authentification et la durée de vie du JWT ;
- les règles CORS pour l'origine du front ;
- la gestion CSRF si des cookies sont utilisés ;
- les limites de taille et de durée des messages ;
- les timeouts et règles de reconnexion recommandées ;
- un `requestId` ou `sessionId` pour corréler les logs front et backend ;
- un environnement de test ou un mock utilisable sans données réelles.

## 4. Fichiers front concernés

- `src/services/chatService.js` : transport SSE texte uniquement ;
- `src/services/voiceService.js` : transport WebSocket audio uniquement ;
- `src/services/authService.js` : lecture et gestion locale du JWT de session ;
- `src/components/dashboard/QuestionComposer.jsx` : saisie et déclenchement texte ;
- `src/components/dashboard/VoiceScreen.jsx` : capture `MediaRecorder`, envoi audio et lecture des réponses ;
- `src/hooks/useDashboard.js` : état métier et orchestration ;
- `.env` : URLs propres à l'environnement, sans secret commité.
