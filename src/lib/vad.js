/**
 * Détection d'activité vocale (VAD) à partir d'un AnalyserNode branché sur le micro.
 *
 * 1. Calibration : les premières millisecondes mesurent le bruit ambiant.
 * 2. La parole commence quand le volume dépasse ce plancher pendant quelques trames.
 * 3. Après la parole, un silence continu de `silenceMs` signifie que l'usager a fini.
 * Un bruit bref (moins de `minSpeechMs` de voix cumulée) est ignoré : l'écoute continue.
 * Sans parole pendant `noSpeechMs`, on abandonne (l'usager n'a rien dit).
 */
const FRAME_MS = 50
const CALIBRATION_MS = 300
const SPEECH_FRAMES = 3

export function createVoiceActivityDetector(analyser, {
  silenceMs = 2000,
  noSpeechMs = 8000,
  maxMs = 60000,
  minSpeechMs = 500,
  onSpeechStart,
  onSpeechEnd,
  onSpeechReset,
  onNoSpeech,
} = {}) {
  const samples = new Uint8Array(analyser.fftSize)
  const startedAt = performance.now()
  let noiseTotal = 0
  let noiseFrames = 0
  let threshold = 0.02
  let loudFrames = 0
  let speaking = false
  let lastVoiceAt = 0
  let voicedMs = 0
  let noSpeechDeadline = noSpeechMs
  let finished = false

  function level() {
    analyser.getByteTimeDomainData(samples)
    let sum = 0
    for (let i = 0; i < samples.length; i += 1) {
      const value = (samples[i] - 128) / 128
      sum += value * value
    }
    return Math.sqrt(sum / samples.length)
  }

  function finish(callback) {
    if (finished) return
    finished = true
    clearInterval(timer)
    callback?.()
  }

  const timer = setInterval(() => {
    const now = performance.now()
    const elapsed = now - startedAt
    const rms = level()

    if (elapsed < CALIBRATION_MS) {
      noiseTotal += rms
      noiseFrames += 1
      return
    }
    if (noiseFrames) {
      // Seuil adaptatif : au-dessus du bruit de la pièce, borné pour rester réaliste.
      threshold = Math.min(0.08, Math.max(0.015, (noiseTotal / noiseFrames) * 3))
      noiseFrames = 0
    }

    if (rms > threshold) {
      loudFrames += 1
      voicedMs += FRAME_MS
      lastVoiceAt = now
      if (!speaking && loudFrames >= SPEECH_FRAMES) {
        speaking = true
        onSpeechStart?.()
      }
    } else {
      loudFrames = 0
      // Avant le début de la parole, un pic isolé ne compte pas comme de la voix.
      if (!speaking) voicedMs = 0
    }

    if (speaking && now - lastVoiceAt >= silenceMs) {
      if (voicedMs >= minSpeechMs) finish(onSpeechEnd)
      else {
        // Toux, porte, bruit de fond : pas assez de voix pour une question, on continue d'écouter.
        speaking = false
        voicedMs = 0
        noSpeechDeadline = elapsed + noSpeechMs
        onSpeechReset?.()
      }
    } else if (!speaking && elapsed >= noSpeechDeadline) finish(onNoSpeech)
    else if (elapsed >= maxMs) finish(speaking ? onSpeechEnd : onNoSpeech)
  }, FRAME_MS)

  return {
    stop: () => finish(),
  }
}
