import { useRef } from 'react'
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
  idle: 'Touchez le micro pour parler',
  listening: 'Je vous écoute…',
  thinking: 'Je réfléchis…',
  speaking: 'Je vous réponds',
  unavailable: 'Mode vocal indisponible',
}

// Libellé affiché sous le micro, et sa version complète pour les lecteurs d'écran.
const micLabels = {
  starting: ['Un instant…', 'Ouverture du micro'],
  idle: ['Parler', 'Commencer à parler'],
  listening: ['J’ai fini', 'J’ai fini de parler'],
  thinking: ['Patientez…', 'Réponse en préparation'],
  speaking: ['Reparler', 'Interrompre et reparler'],
  unavailable: ['Indisponible', 'Micro indisponible'],
}

// Session vocale : l'usager touche le micro pour commencer, puis la conversation s'enchaîne seule.
// Une langue = une session (la clé du composant la réinitialise).
function VoiceSession({ lang, chat, onChangeLanguage }) {
  const rootRef = useRef(null)
  const { phase, heard, answer, audioFailed, notice, languageAlert, analyserRef, toggle, cancel } = useVoiceAssistant({ lang, chat })

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
  // Mode vocal = réponse entendue, pas lue : le texte n'apparaît qu'en secours, si l'audio n'a pas pu être joué.
  const showAnswer = audioFailed && Boolean(answer) && phase !== 'listening'
  const caption = notice || (phase === 'listening'
    ? `Parlez naturellement en ${language.name.toLowerCase()}. Je m’arrête d’écouter dès que vous marquez une pause.`
    : phase === 'thinking' ? 'Je prépare ma réponse…'
      : phase === 'speaking' ? 'Je vous réécoute juste après ma réponse.'
        : phase === 'idle' ? 'Je vous réponds à voix haute, puis la conversation continue toute seule. Touchez « Annuler » pour l’arrêter.' : '')
  const micDisabled = phase === 'starting' || phase === 'thinking' || phase === 'unavailable'
  // « Annuler » n'a de sens que pendant un échange : écoute, attente ou réponse.
  const busy = phase === 'listening' || phase === 'thinking' || phase === 'speaking'
  const [micLabel, micHint] = micLabels[phase]

  return (
    <div className="voice-session" ref={rootRef}>
      <section className="voice-stage" aria-labelledby="voice-title">
        <h1 id="voice-title" className="voice-title" aria-live="polite">{title}</h1>
        <VoiceOrb analyserRef={analyserRef} mode={phase === 'unavailable' || phase === 'starting' ? 'idle' : phase} />
        <div className="voice-caption">
          <p className={cn('voice-hint', notice && 'is-notice')} aria-live="polite">{caption || ' '}</p>
          {showAnswer && <p className="voice-answer" lang={lang}>{plainText(answer)}</p>}
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

      <div className="voice-controls" role="group" aria-label="Commandes vocales">
        <a className="voice-control voice-side" href={viewHref.chat} aria-label="Voir la conversation écrite" title="Voir la conversation écrite">
          <span className="glass-btn is-large" aria-hidden="true"><MessageSquareText /></span>
          <span className="voice-control-label" aria-hidden="true">Écrire</span>
        </a>
        <button type="button" className="voice-control voice-main" onClick={toggle} disabled={micDisabled} aria-label={micHint} title={micHint}>
          <span className={cn('voice-mic', `is-${phase}`)} aria-hidden="true">
            {phase === 'unavailable' ? <MicOff />
              : phase === 'thinking' || phase === 'starting' ? <Loader2 className="spin" />
                : phase === 'speaking' || phase === 'listening' ? <Square className="icon-fill" />
                  : <Mic />}
          </span>
          <span className="voice-control-label" aria-hidden="true">{micLabel}</span>
        </button>
        <button type="button" className="voice-control voice-side" onClick={cancel} disabled={!busy} aria-label="Annuler et rester sur le mode vocal" title="Annuler">
          <span className="glass-btn is-large" aria-hidden="true"><X /></span>
          <span className="voice-control-label" aria-hidden="true">Annuler</span>
        </button>
      </div>
    </div>
  )
}

// Mode vocal : choix de la langue, puis conversation vocale lancée par l'usager.
function VoiceView({ chat, onMenu }) {
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
        ? <VoiceSession key={voiceLang} lang={voiceLang} chat={chat} onChangeLanguage={setVoiceLang} />
        : <VoiceLanguagePicker onSelect={setVoiceLang} />}
    </div>
  )
}

export default VoiceView
