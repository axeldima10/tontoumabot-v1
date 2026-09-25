// Sous-titres vocaux : la réponse est affichée sans les marques de mise en forme (**gras**, listes, titres…).
const MARKDOWN_MARKS = /(\*\*|`+|^#{1,4}\s+|^\s*[-*•]\s+)/gm

export const plainText = (text) => text.replace(MARKDOWN_MARKS, '')
