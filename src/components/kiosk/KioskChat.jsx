import { useLayoutEffect, useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import ChatComposer from '../chat/ChatComposer'
import ChatMessage from '../chat/ChatMessage'
import '../../css/ChatView.css'

// Conversation écrite à la borne : grands caractères, pas de copie ni de partage (écran partagé).
function KioskChat({ chat, copy, lang, canSpeak, topics, onVoice }) {
  const { messages, draft, setDraft, sendMessage, stopStreaming, isStreaming, language, retry } = chat
  const scrollRef = useRef(null)
  const initialCountRef = useRef(messages.length)

  useLayoutEffect(() => {
    const scroller = scrollRef.current
    if (scroller && messages.length) scroller.scrollTop = scroller.scrollHeight
  }, [messages])

  const hasMessages = messages.length > 0

  return (
    <section className="kiosk-screen kchat" aria-label={copy.writeTitle} lang={lang}>
      <div className="kchat-scroll" ref={scrollRef}>
        {hasMessages ? (
          <div className="kchat-thread">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                language={language}
                animate={index >= initialCountRef.current}
                onRetry={retry}
                minimal
              />
            ))}
          </div>
        ) : (
          <div className="kchat-intro">
            <h1>{copy.writeTitle}</h1>
            <p>{copy.writeLead}</p>
            <ul>
              {topics.slice(0, 4).map(({ id, icon: Icon, label }) => (
                <li key={id}>
                  <button type="button" className="khome-topic glass" onClick={() => sendMessage(label[lang])}>
                    <span className="khome-topic-icon" aria-hidden="true"><Icon /></span>
                    <span className="khome-topic-label">{label[lang]}</span>
                    <ChevronRight className="khome-topic-chevron" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="kchat-dock">
        <ChatComposer
          draft={draft}
          onChange={setDraft}
          onSubmit={() => sendMessage()}
          onStop={stopStreaming}
          isStreaming={isStreaming}
          language={language}
          placeholder={copy.placeholder}
          label={copy.writeTitle}
          showLanguage={false}
          showHint={false}
          onVoice={canSpeak ? onVoice : null}
          voiceLabel={copy.toVoice}
        />
      </div>
    </section>
  )
}

export default KioskChat
