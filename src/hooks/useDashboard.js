import { useEffect, useRef, useState } from 'react'
import { getAccessToken } from '../services/authService'
import { streamTextSession } from '../services/chatService'

const languages = ['FR', 'WO', 'EN']
const voiceLanguages = ['Français', 'Wolof', 'English']

// Ce hook regroupe l'état métier du dashboard pour garder la page principalement déclarative.
function useDashboard() {
  const [question, setQuestion] = useState('')
  const [sentQuestion, setSentQuestion] = useState('')
  const [language, setLanguage] = useState('FR')
  const [toolsOpen, setToolsOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [assistantResponse, setAssistantResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [voiceLanguage, setVoiceLanguage] = useState('Wolof')
  const cancelTextSessionRef = useRef(null)

  useEffect(() => () => {
    // Interrompt le flux si la page est démontée avant la fin de la réponse.
    cancelTextSessionRef.current?.()
  }, [])

  function submitQuestion() {
    const cleanQuestion = question.trim()
    if (!cleanQuestion || isStreaming) return

    // Une nouvelle question annule la session précédente avant d'en créer une autre.
    cancelTextSessionRef.current?.()
    setSentQuestion(cleanQuestion)
    setAssistantResponse('')
    setIsStreaming(true)
    setNotice('Réponse en cours…')
    setQuestion('')

    cancelTextSessionRef.current = streamTextSession(
      cleanQuestion,
      (chunk) => setAssistantResponse((current) => current + chunk),
      (error) => {
        setIsStreaming(false)
        setNotice(error.message)
      },
      getAccessToken(),
      () => {
        setIsStreaming(false)
        setNotice('Réponse terminée.')
      },
    )

  }

  function selectFeature(title) {
    setQuestion(title)
    setNotice(`Suggestion ajoutée : ${title}`)
  }

  function cycleLanguage() {
    // Le modulo permet de revenir à la première langue après la dernière.
    setLanguage((current) => languages[(languages.indexOf(current) + 1) % languages.length])
  }

  function cycleVoiceLanguage(nextLanguage) {
    // Le composant vocal peut fournir une langue précise ou demander la suivante.
    setVoiceLanguage(nextLanguage || ((current) => voiceLanguages[(voiceLanguages.indexOf(current) + 1) % voiceLanguages.length]))
  }

  function resetConversation() {
    setQuestion('')
    setSentQuestion('')
    setNotice('')
    setAssistantResponse('')
    setIsStreaming(false)
    setToolsOpen(false)
    setVoiceOpen(false)
  }

  function endSession() {
    setQuestion('')
    setSentQuestion('')
    setToolsOpen(false)
    setVoiceOpen(false)
    setNotice('Session terminée. Vous pouvez commencer une nouvelle demande.')
    setAssistantResponse('')
    setIsStreaming(false)
    cancelTextSessionRef.current?.()
  }

  return {
    question,
    setQuestion,
    sentQuestion,
    language,
    cycleLanguage,
    toolsOpen,
    setToolsOpen,
    notice,
    assistantResponse,
    isStreaming,
    submitQuestion,
    selectFeature,
    resetConversation,
    endSession,
    voiceOpen,
    voiceLanguage,
    openVoice: () => setVoiceOpen(true),
    closeVoice: () => setVoiceOpen(false),
    cycleVoiceLanguage,
  }
}

export default useDashboard
