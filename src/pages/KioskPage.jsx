import { useCallback, useRef, useState } from 'react'
import KioskAttract from '../components/kiosk/KioskAttract'
import KioskChat from '../components/kiosk/KioskChat'
import KioskEnd from '../components/kiosk/KioskEnd'
import KioskHome from '../components/kiosk/KioskHome'
import KioskIdle from '../components/kiosk/KioskIdle'
import KioskLanguage from '../components/kiosk/KioskLanguage'
import KioskPhone from '../components/kiosk/KioskPhone'
import KioskTopBar from '../components/kiosk/KioskTopBar'
import KioskVoice from '../components/kiosk/KioskVoice'
import AppBackground from '../components/layout/AppBackground'
import { kioskCopy, kioskLanguageByCode } from '../data/kioskCopy'
import { kioskTopicsFor } from '../data/kioskTopics'
import useDashboard from '../hooks/useDashboard'
import { useIdle } from '../hooks/useIdle'
import { cn } from '../lib/cn'
import '../css/Kiosk.css'

// Plus long pendant une conversation : l'usager peut être en train de lire une réponse.
const IDLE_MS = { language: 45000, home: 60000, chat: 90000, voice: 90000 }

// Borne d'accueil : une visite = veille → langue → accueil → voix / écrit → fin (tout est effacé).
function KioskPage({ config }) {
  const chat = useDashboard()
  const [screen, setScreen] = useState('attract')
  const [lang, setLang] = useState(null)
  const [idle, setIdle] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [voiceBusy, setVoiceBusy] = useState(false)
  // Écran à retrouver après un changement de langue depuis la barre du haut.
  const returnToRef = useRef('home')

  const copy = kioskCopy[lang ?? 'fr']
  const language = kioskLanguageByCode[lang ?? 'fr']
  const topics = kioskTopicsFor(config.organizationId)
  const inVisit = screen !== 'attract' && screen !== 'end'

  useIdle({
    enabled: inVisit && !idle && !chat.isStreaming && !voiceBusy,
    timeout: IDLE_MS[screen] ?? 60000,
    // Personne n'a rien demandé : retour discret à la veille, sans écran de fin.
    onIdle: () => (chat.messages.length ? setIdle(true) : restart()),
  })

  const handleBusyChange = useCallback((busy) => setVoiceBusy(busy), [])
  const closePhone = useCallback(() => setPhoneOpen(false), [])

  function openLanguage() {
    returnToRef.current = screen
    setScreen('language')
  }

  function chooseLanguage(code) {
    const target = screen === 'language' ? returnToRef.current : screen
    setLang(code)
    chat.setLanguage(code.toUpperCase())
    // En anglais, pas de voix : on revient à l'accueil plutôt qu'à un écran vocal indisponible.
    setScreen(target === 'voice' && !kioskLanguageByCode[code].voice ? 'home' : target)
    returnToRef.current = 'home'
  }

  function askTopic(text) {
    if (!chat.sendMessage(text)) chat.setDraft(text)
    setScreen('chat')
  }

  // Efface toute trace de la visite : conversation, brouillon, lecture vocale, fenêtres ouvertes.
  function endVisit() {
    chat.resetConversation()
    window.speechSynthesis?.cancel()
    setIdle(false)
    setPhoneOpen(false)
    setVoiceBusy(false)
    setScreen('end')
  }

  function restart() {
    chat.resetConversation()
    setLang(null)
    chat.setLanguage('FR')
    setScreen('attract')
  }

  return (
    <div className={cn('app-shell dark is-kiosk', `kiosk-on-${screen}`)}>
      <AppBackground />
      <main className="kiosk">
        {inVisit && lang && (
          <KioskTopBar
            copy={copy}
            language={language}
            showHome={screen !== 'home' && screen !== 'language'}
            onHome={() => setScreen('home')}
            onLanguage={openLanguage}
            onEnd={endVisit}
          />
        )}

        {screen === 'attract' && <KioskAttract onStart={() => { returnToRef.current = 'home'; setScreen('language') }} />}
        {screen === 'language' && <KioskLanguage current={lang} onSelect={chooseLanguage} />}
        {screen === 'home' && (
          <KioskHome
            copy={copy}
            lang={lang}
            canSpeak={language.voice}
            topics={topics}
            onSpeak={() => setScreen('voice')}
            onWrite={() => setScreen('chat')}
            onTopic={askTopic}
            onPhone={() => setPhoneOpen(true)}
          />
        )}
        {screen === 'voice' && (
          <KioskVoice
            key={lang}
            lang={lang}
            chat={chat}
            copy={copy}
            onBusyChange={handleBusyChange}
            onWrite={() => setScreen('chat')}
            onChangeLanguage={chooseLanguage}
          />
        )}
        {screen === 'chat' && (
          <KioskChat
            chat={chat}
            copy={copy}
            lang={lang}
            canSpeak={language.voice}
            topics={topics}
            onVoice={() => setScreen('voice')}
          />
        )}
        {screen === 'end' && <KioskEnd copy={copy} lang={lang ?? 'fr'} onRestart={restart} />}
      </main>

      {phoneOpen && <KioskPhone copy={copy} lang={lang} onClose={closePhone} />}
      {idle && <KioskIdle copy={copy} lang={lang} onContinue={() => setIdle(false)} onEnd={endVisit} />}
    </div>
  )
}

export default KioskPage
