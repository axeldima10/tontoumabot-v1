import { useRef, useState } from 'react'
import { Loader2, MessageSquareText, Mic, MicOff, Square, X } from 'lucide-react'
import { voiceLanguageByCode } from '../../data/voiceLanguages'
import { viewHref } from '../../hooks/useHashView'
import useVoiceAssistant from '../../hooks/useVoiceAssistant'
import { cn } from '../../lib/cn'
import { plainText } from '../../lib/plainText'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'
import AppHeader from '../layout/AppHeader'
import Flag from './Flag'
import VoiceLanguagePicker from './VoiceLanguagePicker'
import VoiceOrb from './VoiceOrb'
import '../../css/VoiceView.css'

const titles = {
  starting: 'Un instant…',
  idle: 'Touchez pour parler',
  listening: 'Je vous écoute…',
  thinking: 'Je réfléchis…',
  speaking: 'Je vous réponds',
  unavailable: 'Mode vocal indisponible',
}

const micLabels = {
  idle: 'Commencer à parler',
  listening: 'J’ai fini de parler',
  thinking: 'Annuler la demande',
  speaking: 'Interrompre et reparler',
}

const HANDS_FREE_KEY = 'tontuma_voice_hands_free'

function readHandsFree() {
  try {
    return localStorage.getItem(HANDS_FREE_KEY) !== 'off'
  } catch {
    return true
  }
}

// Session vocale « mains libres » : une langue = une session (la clé du composant la réinitialise).
function VoiceSession({ lang, chat, onChangeLanguage, onClose }) {
  const rootRef = useRef(null)
  // Mains libres : après chaque réponse, l'écoute reprend seule. À couper dans un lieu bruyant.
  const [handsFree, setHandsFree] = useState(readHandsFree)
  const { phase, heard, answer, notice, languageAlert, analyserRef, toggle } = useVoiceAssistant({ lang, chat, handsFree })

  function toggleHandsFree() {
    const next = !handsFree
    setHandsFree(next)
    try {
      localStorage.setItem(HANDS_FREE_KEY, next ? 'on' : 'off')
    } catch {
      // Préférence non mémorisée (navigation privée) : elle reste valable pour cette session.
    }
  }

  const language = voiceLanguageByCode[lang]
  const suggested = languageAlert && voiceLanguageByCode[String(languageAlert.detectedLanguage).slice(0, 2).toLowerCase()]

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.voice-title', { y: 20, autoAlpha: 0, duration: 0.7 })
        .from('.voice-caption', { y: 16, autoAlpha: 0, duration: 0.7 }, '+=0.3')
        .from('.voice-control', { y: 30, autoAlpha: 0, scale: 0.8, stagger: 0.08, duration: 0.6, ease: 'back.out(1.8)' }, '-=0.5')
    })
    return () => mm.revert()
  }, { scope: rootRef })

  // Le titre suit la phase ; en écoute, il confirme que la voix a bien été détectée.
  const title = phase === 'listening' && heard ? 'Je vous entends…' : titles[phase]
  const showAnswer = Boolean(answer) && phase !== 'listening'
  const caption = notice || (phase === 'listening'
    ? `Parlez naturellement en ${language.name.toLowerCase()}. Je m’arrête d’écouter dès que vous marquez une pause.`
    : phase === 'thinking' ? 'Je prépare ma réponse…' : '')
  const micDisabled = phase === 'starting' || phase === 'unavailable'

  return (
    <div className="voice-session" ref={rootRef}>
      <section className="voice-stage" aria-labelledby="voice-title">
        <h1 id="voice-title" className="voice-title" aria-live="polite">{title}</h1>
        <VoiceOrb analyserRef={analyserRef} mode={phase === 'unavailable' || phase === 'starting' ? 'idle' : phase} />
        <div className="voice-caption">
          {showAnswer ? (
            <p className="voice-answer" aria-live="polite" lang={lang}>{plainText(answer)}</p>
          ) : (
            <p className={cn('voice-hint', notice && 'is-notice')} aria-live="polite">{caption || ' '}</p>
          )}
          {suggested && suggested.code !== lang && (
            <div className="voice-alert glass" role="status">
              <Flag code={suggested.flag} />
              <span>Il semble que vous parliez {suggested.name.toLowerCase()}.</span>
              <button type="button" className="glass-pill" onClick={() => onChangeLanguage(suggested.code)}>
                Passer en {suggested.name}
              </button>
            </div>
          )}
        </div>
      </section>

      <button type="button" className="voice-handsfree" aria-pressed={handsFree} onClick={toggleHandsFree}>
        <span className="voice-switch" aria-hidden="true" />
        Écoute continue
      </button>

      <div className="voice-controls" role="group" aria-label="Commandes vocales">
        <a className="voice-control glass-btn is-large" href={viewHref.chat} aria-label="Voir la conversation écrite" title="Voir la conversation écrite">
          <MessageSquareText aria-hidden="true" />
        </a>
        <button
          type="button"
          className={cn('voice-control voice-mic', `is-${phase}`)}
          onClick={toggle}
          disabled={micDisabled}
          aria-label={micLabels[phase] ?? 'Micro indisponible'}
          title={micLabels[phase]}
        >
          {phase === 'unavailable' ? <MicOff aria-hidden="true" />
            : phase === 'thinking' ? <Loader2 className="spin" aria-hidden="true" />
              : phase === 'speaking' || phase === 'listening' ? <Square className="icon-fill" aria-hidden="true" />
                : <Mic aria-hidden="true" />}
        </button>
        <button type="button" className="voice-control glass-btn is-large" onClick={onClose} aria-label="Quitter le mode vocal" title="Quitter">
          <X aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

// Mode vocal : choix de la langue, puis conversation vocale continue.
function VoiceView({ chat, onMenu, onClose }) {
  const { voiceLang, setVoiceLang } = chat
  const language = voiceLang ? voiceLanguageByCode[voiceLang] : null

  return (
    <div className="voice-view">
      <AppHeader
        title={<>Parler avec <span translate="no">Tontouma</span></>}
        onMenu={onMenu}
        right={language ? (
          <button type="button" className="glass-pill voice-lang" onClick={() => setVoiceLang(null)} aria-label={`Langue : ${language.name}. Changer de langue`}>
            <Flag code={language.flag} />
            <span className="only-desktop">{language.name}</span>
            <span className="only-mobile">{language.code.toUpperCase()}</span>
          </button>
        ) : null}
      />
      {language
        ? <VoiceSession key={voiceLang} lang={voiceLang} chat={chat} onChangeLanguage={setVoiceLang} onClose={onClose} />
        : <VoiceLanguagePicker onSelect={setVoiceLang} />}
    </div>
  )
}

export default VoiceView
