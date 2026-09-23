# Contrat backend TONTUMA-BOT

Ce document décrit ce que le front attend des backends Java et Python. Les deux
canaux sont séparés car le texte et la voix n'ont pas le même protocole ni le
même cycle de vie.

## 1. Backend conversationnel : message texte

### Endpoint attendu

```http
POST /api/v1/public/conversations/{conversationId}/messages
Accept: application/json
Content-Type: application/json
```

`conversationId` est obligatoire dans l'URL. Le front génère un UUID pour une
nouvelle conversation, ou utilise `VITE_CONVERSATION_ID` lorsqu'il est fourni.
L'authentification est volontairement désactivée côté front pour cette première
intégration.

# Moi côté Front
Le front utilise la variable `VITE_TEXT_SESSION_URL` pour remplacer cette URL.

### Requête

```json
{
  "content": "Je souhaite connaître les documents nécessaires",
  "tts": true,
  "language": "fr"
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

## 2. Question vocale (HTTP + SSE)

### Endpoint

```http
POST /api/v1/public/conversations/{id}/messages/audio?lang=wo|fr&tts=true
Content-Type: multipart/form-data   (champ file : WebM, M4A, WAV ou MP3)
Accept: text/event-stream
```

- `lang` choisit le moteur de transcription (wolof par défaut, 400 pour toute autre valeur) :
  le front l'envoie à chaque question, selon la langue choisie par l'usager.
- La réponse est le même flux SSE que les questions écrites : `message` ({delta}),
  `audio-chunk` ({audioUrl, index, total}), `language-alert`, `error`, puis `done`.
- Les morceaux audio sont lus via `GET /api/v1/public/conversations/audio/{filename}`.
- La transcription de la question n'est pas dans le flux : le front la relit via `GET /{id}/messages`.

### Fonctionnement côté front (mode « mains libres »)

1. L'usager choisit sa langue (wolof ou français), l'écoute démarre aussitôt.
2. `MediaRecorder` enregistre ; un détecteur d'activité vocale (`src/lib/vad.js`) mesure le volume
   du micro et coupe l'enregistrement après 2 s de silence continu.
3. L'audio est envoyé en une requête ; le texte s'affiche en direct et les morceaux audio sont joués dans l'ordre.
4. À la fin de la réponse, l'écoute reprend automatiquement.

Sans conversation existante, le front la crée avec `organizationId` (`VITE_ORGANISATION_ID`) s'il est
configuré, sinon avec une courte salutation comme `question` (l'API exige l'un des deux).

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

- `src/services/chatService.js` : transport HTTP + SSE (texte et voix) ;
- `src/lib/vad.js` : détection de fin de phrase ;
- `src/hooks/useVoiceAssistant.js` : boucle écoute → envoi → réponse audio ;
- `src/services/authService.js` : lecture et gestion locale du JWT de session ;
- `src/components/chat/ChatComposer.jsx` : saisie et déclenchement texte ;
- `src/components/voice/VoiceView.jsx` : choix de la langue et écran vocal ;
- `src/hooks/useDashboard.js` : état métier et orchestration ;
- `.env` : URLs propres à l'environnement, sans secret commité.
