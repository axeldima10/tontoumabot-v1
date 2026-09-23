import { useEffect, useRef, useState } from 'react'
import { sendChatMessage } from '../services/chatService'

export const languages = ['FR', 'WO', 'EN']
export const languageNames = { FR: 'Français', WO: 'Wolof', EN: 'English' }

// Ce hook regroupe l'état de la conversation pour garder les vues principalement déclaratives.
function useDashboard() {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [language, setLanguage] = useState('FR')
  const [isStreaming, setIsStreaming] = useState(false)
  const [voiceLang, setVoiceLang] = useState(null)
  // Vide tant que le backend n'a pas créé la conversation : c'est lui qui génère l'identifiant.
  const conversationIdRef = useRef('')
  const cancelRef = useRef(null)
  const idRef = useRef(0)

  useEffect(() => () => {
    // Interrompt le flux si la page est démontée avant la fin de la réponse.
    cancelRef.current?.()
  }, [])

  function sendMessage(text = draft) {
    const content = text.trim()
    if (!content || isStreaming) return false

    cancelRef.current?.()
    const userId = `m${++idRef.current}`
    const botId = `m${++idRef.current}`
    const updateBot = (patch) => setMessages((current) => current.map((message) => (
      message.id === botId ? { ...message, ...patch } : message
    )))

    setMessages((current) => [
      ...current,
      { id: userId, role: 'user', content },
      { id: botId, role: 'assistant', content: '', status: 'pending', question: content, userId },
    ])
    setDraft('')
    setIsStreaming(true)

    cancelRef.current = sendChatMessage({
      conversationId: conversationIdRef.current,
      content,
      language: language.toLowerCase(),
      tts: false,
      onConversationId: (id) => { conversationIdRef.current = id },
      onResponse: (answer) => updateBot({ content: answer, status: 'streaming' }),
      onError: (error) => {
        setIsStreaming(false)
        updateBot({ status: 'error', error: error.message })
      },
      onComplete: () => {
        setIsStreaming(false)
        updateBot({ status: 'done' })
      },
    })
    return true
  }

  function stopStreaming() {
    cancelRef.current?.()
    cancelRef.current = null
    setIsStreaming(false)
    setMessages((current) => current.map((message) => (
      message.status === 'pending' || message.status === 'streaming' ? { ...message, status: 'stopped' } : message
    )))
  }

  function retry(messageId) {
    const failed = messages.find((message) => message.id === messageId)
    if (!failed || isStreaming) return
    // On retire la question et la réponse en échec avant de renvoyer la même question.
    setMessages((current) => current.filter((message) => message.id !== failed.id && message.id !== failed.userId))
    sendMessage(failed.question)
  }

  function updateMessage(id, patch) {
    setMessages((current) => current.map((message) => (message.id === id ? { ...message, ...patch } : message)))
  }

  /**
   * Ajoute un tour vocal au fil de discussion : la transcription arrive après coup
   * (GET /messages), la réponse est remplie au fil du flux SSE.
   */
  function beginVoiceTurn() {
    const userId = `m${++idRef.current}`
    const botId = `m${++idRef.current}`
    setMessages((current) => [
      ...current,
      { id: userId, role: 'user', content: 'Question vocale', via: 'voice' },
      { id: botId, role: 'assistant', content: '', status: 'pending', via: 'voice' },
    ])
    return { userId, botId }
  }

  function cycleLanguage() {
    // Le modulo permet de revenir à la première langue après la dernière.
    setLanguage((current) => languages[(languages.indexOf(current) + 1) % languages.length])
  }

  function resetConversation() {
    cancelRef.current?.()
    cancelRef.current = null
    conversationIdRef.current = ''
    setMessages([])
    setDraft('')
    setIsStreaming(false)
  }

  return {
    messages,
    draft,
    setDraft,
    language,
    cycleLanguage,
    isStreaming,
    sendMessage,
    stopStreaming,
    retry,
    resetConversation,
    // Mode vocal : langue de transcription (null = pas encore choisie) et conversation partagée.
    voiceLang,
    setVoiceLang,
    conversationIdRef,
    beginVoiceTurn,
    updateMessage,
  }
}

export default useDashboard
