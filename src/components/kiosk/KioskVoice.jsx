import { useEffect, useRef } from 'react'
import { Keyboard, Loader2, Mic, MicOff, Square } from 'lucide-react'
import { kioskLanguageByCode } from '../../data/kioskCopy'
import useVoiceAssistant from '../../hooks/useVoiceAssistant'
import { cn } from '../../lib/cn'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'
import { plainText } from '../../lib/plainText'
import Flag from '../voice/Flag'
import VoiceOrb from '../voice/VoiceOrb'
import '../../css/VoiceView.css'

// Voix à la borne : pas d'écoute continue (lieu public, bruit ambiant), on touche le micro à chaque question.
function KioskVoice({ lang, chat, copy, onBusyChange, onWrite, onChangeLanguage }) {
  const rootRef = useRef(null)
  const { phase, heard, answer, notice, languageAlert, analyserRef, toggle } = useVoiceAssistant({ lang, chat, handsFree: false })
  const busy = phase === 'listening' || phase === 'thinking' || phase === 'speaking'

  useEffect(() => {
    onBusyChange(busy)
  }, [busy, onBusyChange])

  useEffect(() => () => onBusyChange(false), [onBusyChange])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.kvoice-title', { y: 24, autoAlpha: 0, duration: 0.7 })
        .from('.kvoice-caption', { y: 20, autoAlpha: 0, duration: 0.7 }, '+=0.3')
        .from('.kvoice-control', { y: 40, autoAlpha: 0, scale: 0.8, stagger: 0.08, duration: 0.7, ease: 'back.out(1.8)' }, '-=0.5')
    })
    return () => mm.revert()
  }, { scope: rootRef })

  const detected = languageAlert && kioskLanguageByCode[String(languageAlert.detectedLanguage).slice(0, 2).toLowerCase()]
  const suggested = detected?.voice && detected.code !== lang ? detected : null
  const title = phase === 'listening' && heard ? copy.phases.heard : copy.phases[phase]
  const showAnswer = Boolean(answer) && phase !== 'listening'
  const hint = notice || (phase === 'listening' ? copy.voiceHint : phase === 'thinking' ? copy.thinkingHint : '')
  const micLabel = phase === 'listening' ? copy.micStop
    : phase === 'thinking' ? copy.micCancel
      : phase === 'speaking' ? copy.micInterrupt : copy.micStart

  return (
    <section className="kiosk-screen kvoice" ref={rootRef} aria-labelledby="kvoice-title" lang={lang}>
      <h1 id="kvoice-title" className="kvoice-title" aria-live="polite">{title}</h1>

      <VoiceOrb analyserRef={analyserRef} mode={phase === 'unavailable' || phase === 'starting' ? 'idle' : phase} />

      <div className="kvoice-caption">
        {showAnswer
          ? <p className="kvoice-answer" aria-live="polite">{plainText(answer)}</p>
          : <p className={cn('kvoice-hint', notice && 'is-notice')} aria-live="polite">{hint || ' '}</p>}
        {suggested && (
          <div className="kvoice-alert glass" role="status">
            <Flag code={suggested.flag} />
            <span>{copy.detected(suggested.name)}</span>
            <button type="button" className="kiosk-pill" onClick={() => onChangeLanguage(suggested.code)}>
              {copy.switchTo(suggested.name)}
            </button>
          </div>
        )}
      </div>

      <div className="kvoice-controls" role="group">
        <button type="button" className="kvoice-control kvoice-side glass" onClick={onWrite}>
          <Keyboard aria-hidden="true" />
          <span>{copy.toWrite}</span>
        </button>
        <button
          type="button"
          className={cn('kvoice-control kvoice-mic', `is-${phase}`)}
          onClick={toggle}
          disabled={phase === 'starting' || phase === 'unavailable'}
          aria-label={micLabel}
        >
          <span className="kvoice-mic-disc" aria-hidden="true">
            {phase === 'unavailable' ? <MicOff />
              : phase === 'thinking' ? <Loader2 className="spin" />
                : phase === 'speaking' || phase === 'listening' ? <Square className="icon-fill" /> : <Mic />}
          </span>
          <span className="kvoice-mic-label" aria-hidden="true">{micLabel}</span>
        </button>
        <span className="kvoice-side-spacer" aria-hidden="true" />
      </div>
    </section>
  )
}

export default KioskVoice
