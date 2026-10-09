// Textes de la borne dans les deux langues d'accueil.
// Le wolof est une première proposition : à faire relire par un locuteur natif avant la mise en service.
export const kioskLanguages = [
  { code: 'wo', name: 'Wolof', flag: 'sn', tagline: 'Wax ci Wolof', voice: true },
  { code: 'fr', name: 'Français', flag: 'fr', tagline: 'Parler en français', voice: true },
]

export const kioskLanguageByCode = Object.fromEntries(kioskLanguages.map((language) => [language.code, language]))

// Écran de veille : chaque langue défile à tour de rôle.
export const attractSlides = [
  { lang: 'wo', greeting: 'Dalal ak jàmm', touch: 'Laal ekraan bi ngir tàmbali' },
  { lang: 'fr', greeting: 'Bienvenue', touch: 'Touchez l’écran pour commencer' },
]

export const languagePrompt = [
  { lang: 'fr', text: 'Choisissez votre langue' },
  { lang: 'wo', text: 'Tànnal sa làkk' },
]

const rawCopy = {
  fr: {
    brandLine: 'Votre assistant pour les démarches administratives',
    hello: 'Comment puis-je vous aider ?',
    speak: 'Parler',
    speakSub: 'Posez votre question à voix haute',
    write: 'Écrire',
    writeSub: 'Tapez votre question',
    topics: 'Questions fréquentes',
    privacy: 'Anonyme · Rien n’est conservé après votre départ',
    phone: 'Sur mon téléphone',
    home: 'Accueil',
    language: 'Langue',
    end: 'Terminer',
    phases: {
      starting: 'Un instant…',
      idle: 'Touchez le micro pour parler',
      listening: 'Je vous écoute…',
      heard: 'Je vous entends…',
      thinking: 'Je réfléchis…',
      speaking: 'Je vous réponds',
      unavailable: 'Micro indisponible',
    },
    voiceHint: 'Parlez naturellement, puis marquez une pause.',
    thinkingHint: 'Je prépare ma réponse…',
    idleHint: 'Je vous réponds à voix haute, puis je vous réécoute. Touchez « Annuler » pour arrêter.',
    micWait: 'Patientez…',
    micStart: 'Parler',
    micStop: 'J’ai fini',
    micCancel: 'Annuler',
    micInterrupt: 'Reparler',
    toWrite: 'Écrire',
    toVoice: 'Parler',
    writeTitle: 'Écrivez votre question',
    writeLead: 'Ou touchez une question fréquente.',
    placeholder: 'Écrivez votre question ici…',
    send: 'Envoyer',
    switchTo: (name) => `Passer en ${name}`,
    detected: (name) => `Il semble que vous parliez ${name.toLowerCase()}.`,
    stillThere: 'Vous êtes toujours là ?',
    stillThereLead: 'Pour protéger votre vie privée, la session va se fermer et tout sera effacé.',
    keepGoing: 'Je continue',
    endNow: 'Terminer maintenant',
    closingIn: (seconds) => `Fermeture dans ${seconds} s`,
    thanks: 'Merci de votre visite !',
    erased: 'Vos échanges ont été effacés de cette borne.',
    qrTitle: 'Continuez sur votre téléphone',
    qrLead: 'Scannez ce code pour retrouver Tontouma partout, gratuitement.',
    newVisit: 'Nouvelle visite',
    backIn: (seconds) => `Retour à l’accueil dans ${seconds} s`,
    close: 'Fermer',
  },
  wo: {
    brandLine: 'Sa ndimbal ngir say démarches administratives',
    hello: 'Naka laa la mëna dimbali ?',
    speak: 'Wax',
    speakSub: 'Laajal sa laaj ci sa baat',
    write: 'Bind',
    writeSub: 'Bindal sa laaj',
    topics: 'Laaj yi ëpp',
    privacy: 'Sa tur du feeñ · Dara du des bu nga demee',
    phone: 'Ci sama telefon',
    home: 'Njëlbéen',
    language: 'Làkk',
    end: 'Jeexal',
    phases: {
      starting: 'Xaaral tuuti…',
      idle: 'Laal mikro bi ngir wax',
      listening: 'Maa ngi lay déglu…',
      heard: 'Maa ngi lay dégg…',
      thinking: 'Maa ngi xalaat…',
      speaking: 'Maa ngi lay tontu',
      unavailable: 'Mikro bi du dox',
    },
    voiceHint: 'Waxal ni nga baax, te taxaw tuuti bu nga noppee.',
    thinkingHint: 'Maa ngi waajal tontu bi…',
    idleHint: 'Dinaa la tontu ci kaw, te dinaa la dégluwaat. Laal « Bàyyi » ngir taxawal.',
    micWait: 'Xaaral…',
    micStart: 'Wax',
    micStop: 'Noppi naa',
    micCancel: 'Bàyyi',
    micInterrupt: 'Waxaat',
    toWrite: 'Bind',
    toVoice: 'Wax',
    writeTitle: 'Bindal sa laaj',
    writeLead: 'Walla laal benn ci laaj yi ëpp.',
    placeholder: 'Bindal sa laaj fii…',
    send: 'Yónnee',
    switchTo: (name) => `Wax ci ${name}`,
    detected: (name) => `Mel na ni danga wax ci ${name}.`,
    stillThere: 'Ndax yaa ngi fi ?',
    stillThereLead: 'Ngir aar sa sutura, dinañu tëj waxtaan bi te far lépp.',
    keepGoing: 'Maa ngi fi',
    endNow: 'Jeexal leegi',
    closingIn: (seconds) => `Dina tëju ci ${seconds} s`,
    thanks: 'Jërëjëf ci sa ganesu !',
    erased: 'Say waxtaan far nañu leen ci borne bi.',
    qrTitle: 'Jokkal ci sa telefon',
    qrLead: 'Scanne-al code bii ngir gis Tontouma fu nekk, te doo fey dara.',
    newVisit: 'Beneen ganesu',
    backIn: (seconds) => `Dellu ci njëlbéen ci ${seconds} s`,
    close: 'Tëj',
  },
}

// Typographie française : espace insécable avant ? ! : ; pour qu'un signe ne parte jamais seul à la ligne.
export const typo = (text) => text.replace(/ ([?!:;»])/g, ' $1')

const typoAll = (value) => {
  if (typeof value === 'string') return typo(value)
  if (typeof value === 'function') return (...args) => typo(value(...args))
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, typoAll(entry)]))
}

export const kioskCopy = typoAll(rawCopy)
