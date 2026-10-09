import { useCallback, useRef, useState } from 'react'
import ChatView from '../components/chat/ChatView'
import AccountSheet from '../components/layout/AccountSheet'
import AppBackground from '../components/layout/AppBackground'
import InstallPrompt from '../components/layout/InstallPrompt'
import Sidebar from '../components/layout/Sidebar'
import Onboarding from '../components/onboarding/Onboarding'
import VoiceView from '../components/voice/VoiceView'
import { useTheme } from '../context/ThemeContext'
import useDashboard from '../hooks/useDashboard'
import useHashView from '../hooks/useHashView'
import useMediaQuery from '../hooks/useMediaQuery'
import { cn } from '../lib/cn'
import { markOnboardingDone, shouldShowOnboarding } from '../lib/onboarding'
import { getCurrentUser } from '../services/authService'
import '../css/DashboardPage.css'

// Page-orchestratrice : elle assemble les vues et relie leurs événements au hook de conversation.
function DashboardPage() {
  const { dark } = useTheme()
  const chat = useDashboard()
  const [view, navigate] = useHashView()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [menuOpen, setMenuOpen] = useState(false)
  // L'utilisateur est lu une fois : l'application fonctionne aussi en mode invité (null).
  const [user] = useState(getCurrentUser)
  const mainRef = useRef(null)
  // Présentation au tout premier passage (PWA : une fois par appareil, jamais bloquante).
  const [onboarding, setOnboarding] = useState(shouldShowOnboarding)
  const [accountOpen, setAccountOpen] = useState(false)

  const firstName = user?.firstName || user?.name?.split(' ')[0] || ''
  const recents = chat.messages.filter((message) => message.role === 'user').reverse().slice(0, 6)

  // L'invitation à installer n'apparaît qu'après une première réponse réussie (moment de valeur).
  const hasAnswer = chat.messages.some((message) => message.role === 'assistant' && message.status === 'done' && message.content)

  const openMenu = useCallback(() => setMenuOpen(true), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const closeAccount = useCallback(() => setAccountOpen(false), [])

  function openAccount() {
    closeMenu()
    setAccountOpen(true)
  }

  function newChat() {
    chat.resetConversation()
    closeMenu()
    navigate('chat')
  }

  function endSession() {
    chat.resetConversation()
    closeMenu()
    navigate('voice')
  }

  function finishOnboarding() {
    markOnboardingDone()
    setOnboarding(false)
    // Après la présentation, l'usager arrive là où il peut parler tout de suite.
    navigate('voice')
  }

  function signInFromOnboarding() {
    finishOnboarding()
    setAccountOpen(true)
  }

  function replayOnboarding() {
    closeMenu()
    setOnboarding(true)
  }

  function openRecent(messageId) {
    closeMenu()
    navigate('chat')
    // Deux frames : la vue discussion doit être montée avant de faire défiler jusqu'au message.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById(`msg-${messageId}`)?.scrollIntoView({ block: 'center' })
    }))
  }

  if (onboarding) {
    return (
      <div className={cn('app-shell', dark && 'dark', 'is-onboarding')}>
        <AppBackground />
        <Onboarding onDone={finishOnboarding} onSignIn={signInFromOnboarding} />
      </div>
    )
  }

  return (
    <div className={cn('app-shell', dark && 'dark', `view-${view}`)}>
      <button type="button" className="skip-link" onClick={() => mainRef.current?.focus()}>
        Aller au contenu
      </button>
      <AppBackground />
      <Sidebar
        view={view}
        open={menuOpen}
        isDesktop={isDesktop}
        user={user}
        recents={recents}
        onClose={closeMenu}
        onNewChat={newChat}
        onOpenRecent={openRecent}
        onEndSession={endSession}
        onReplayIntro={replayOnboarding}
        onOpenAccount={openAccount}
      />
      <main className="app-main" ref={mainRef} tabIndex={-1} inert={!isDesktop && menuOpen}>
        {view === 'chat' ? (
          <ChatView chat={chat} firstName={firstName} isGuest={!user} onMenu={openMenu} onNewChat={newChat} onOpenAccount={openAccount} />
        ) : (
          <VoiceView chat={chat} onMenu={openMenu} />
        )}
      </main>
      {hasAnswer && <InstallPrompt />}
      <AccountSheet open={accountOpen} onClose={closeAccount} />
    </div>
  )
}

export default DashboardPage
