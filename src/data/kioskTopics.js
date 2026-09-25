import { Banknote, CalendarClock, FileText, Hourglass, Search, Signpost } from 'lucide-react'
import { typo } from './kioskCopy'

// Questions d'orientation valables dans n'importe quelle structure : utilisées quand
// l'organisation de la borne n'a pas encore sa propre liste.
const generalTopics = [
  {
    id: 'documents',
    icon: FileText,
    label: {
      fr: 'Quels documents dois-je apporter ?',
      wo: 'Ban kayit laa wara indi ?',
      en: 'Which documents should I bring?',
    },
  },
  {
    id: 'desk',
    icon: Signpost,
    label: {
      fr: 'À quel guichet dois-je m’adresser ?',
      wo: 'Ban guichet laa wara dem ?',
      en: 'Which desk should I go to?',
    },
  },
  {
    id: 'hours',
    icon: CalendarClock,
    label: {
      fr: 'Quels sont les horaires d’ouverture ?',
      wo: 'Ban waxtu ngeen di ubbi ?',
      en: 'What are the opening hours?',
    },
  },
  {
    id: 'fees',
    icon: Banknote,
    label: {
      fr: 'Combien coûte ma démarche ?',
      wo: 'Ñaata la sama démarche di jar ?',
      en: 'How much does my procedure cost?',
    },
  },
  {
    id: 'delay',
    icon: Hourglass,
    label: {
      fr: 'En combien de temps aurai-je mon document ?',
      wo: 'Kañ laa am sama kayit ?',
      en: 'How long until I get my document?',
    },
  },
  {
    id: 'follow-up',
    icon: Search,
    label: {
      fr: 'Comment suivre ma demande ?',
      wo: 'Naka laa mëna topp sama laaj ?',
      en: 'How can I track my request?',
    },
  },
]

/**
 * Questions propres à chaque organisation, indexées par son identifiant (paramètre `org` de la borne).
 * Même format que ci-dessus ; à remplacer plus tard par un appel au backend.
 */
const topicsByOrganization = {
  // 'id-de-l-organisation': [ { id, icon, label: { fr, wo, en } }, … ],
}

const withTypo = (topics) => topics.map((topic) => ({
  ...topic,
  label: Object.fromEntries(Object.entries(topic.label).map(([lang, text]) => [lang, typo(text)])),
}))

export function kioskTopicsFor(organizationId) {
  return withTypo(topicsByOrganization[organizationId] ?? generalTopics)
}
