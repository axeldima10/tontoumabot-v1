import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { ArrowDown, SquarePen } from 'lucide-react'
import { prefersReducedMotion } from '../../lib/gsap'
import AppHeader from '../layout/AppHeader'
import { ThemeToggle } from '../layout/ThemeControls'
import ChatComposer from './ChatComposer'
import ChatIntro from './ChatIntro'
import ChatMessage from './ChatMessage'
import '../../css/ChatView.css'

const STICK_THRESHOLD = 96

// Vue discussion : intro animée quand la conversation est vide, fil de messages ensuite.
function ChatView({ chat, firstName, onMenu, onNewChat }) {
  const { messages, draft, setDraft, sendMessage, stopStreaming, isStreaming, language, cycleLanguage } = chat
  const scrollRef = useRef(null)
  const stickRef = useRef(true)
  // Les messages déjà présents à l'ouverture de la vue apparaissent sans animation.
  const initialCountRef = useRef(messages.length)
  const [showJump, setShowJump] = useState(false)

  // Référence stable pour les messages mémoïsés : la dernière version de retry est toujours appelée.
  const retryRef = useRef(chat.retry)
  const handleRetry = useCallback((id) => retryRef.current(id), [])

  useLayoutEffect(() => {
    retryRef.current = chat.retry
  })

  useLayoutEffect(() => {
    // Après « Nouvelle discussion », les prochains messages sont de nouveau animés.
    if (!messages.length) initialCountRef.current = 0
    const scroller = scrollRef.current
    if (scroller && stickRef.current) scroller.scrollTop = scroller.scrollHeight
  }, [messages])

  function handleScroll() {
    const scroller = scrollRef.current
    const nearBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < STICK_THRESHOLD
    stickRef.current = nearBottom
    setShowJump(!nearBottom)
  }

  function jumpToLatest() {
    stickRef.current = true
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  function send(text) {
    stickRef.current = true
    return sendMessage(text)
  }

  const hasMessages = messages.length > 0
  const lastStatus = messages.at(-1)?.status

  return (
    <div className="chat-view">
      <AppHeader
        title={hasMessages ? 'Discussion' : 'Nouvelle discussion'}
        onMenu={onMenu}
        right={(
          <>
            {hasMessages && (
              <button type="button" className="glass-btn" onClick={onNewChat} aria-label="Nouvelle discussion" title="Nouvelle discussion">
                <SquarePen aria-hidden="true" />
              </button>
            )}
            <ThemeToggle className="only-mobile" />
          </>
        )}
      />

      <div className="chat-scroll" ref={scrollRef} onScroll={handleScroll}>
        {hasMessages ? (
          <section className="chat-thread" aria-label="Conversation avec Tontouma">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                language={language}
                animate={index >= initialCountRef.current}
                onRetry={handleRetry}
              />
            ))}
          </section>
        ) : (
          <ChatIntro firstName={firstName} onSuggestion={send} />
        )}
      </div>

      <div className="chat-dock">
        {showJump && hasMessages && (
          <button type="button" className="glass-btn chat-jump" onClick={jumpToLatest} aria-label="Aller au dernier message">
            <ArrowDown aria-hidden="true" />
          </button>
        )}
        <ChatComposer
          draft={draft}
          onChange={setDraft}
          onSubmit={() => send()}
          onStop={stopStreaming}
          isStreaming={isStreaming}
          language={language}
          onCycleLanguage={cycleLanguage}
        />
        <p className="chat-disclaimer">Tontouma peut se tromper : vérifiez les informations importantes auprès du service concerné.</p>
        <p className="sr-only" aria-live="polite">
          {lastStatus === 'pending' ? 'Tontouma rédige une réponse…' : lastStatus === 'done' ? 'Réponse reçue.' : ''}
        </p>
      </div>
    </div>
  )
}

export default ChatView
