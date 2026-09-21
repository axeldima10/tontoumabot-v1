import { FileCheck2, Map, MessageSquarePlus } from 'lucide-react'

// Données d'affichage des cartes : les composants restent génériques et ne connaissent pas le contenu métier.
export const quickActions = [
  {
    title: 'Démarches & offres',
    description: 'Obtenez les synthèses et les conditions clés.',
    icon: MessageSquarePlus,
  },
  {
    title: 'Formulaires de service',
    description: 'Remplissez vos critères et emportez votre mémo.',
    icon: FileCheck2,
  },
  {
    title: 'Cartographie interne',
    description: 'Obtenez votre itinéraire vers le bon point de service.',
    icon: Map,
  },
]
