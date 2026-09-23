// Langues de transcription acceptées par POST /messages/audio (`lang`) : wo ou fr uniquement.
export const voiceLanguages = [
  {
    code: 'wo',
    name: 'Wolof',
    greeting: 'Wax ci Wolof',
    description: 'Parler en wolof',
    flag: 'sn',
  },
  {
    code: 'fr',
    name: 'Français',
    greeting: 'Parler en français',
    description: 'Je vous réponds en français',
    flag: 'fr',
  },
]

export const voiceLanguageByCode = Object.fromEntries(voiceLanguages.map((language) => [language.code, language]))
