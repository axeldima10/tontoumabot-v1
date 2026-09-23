import { FileCheck2, IdCard, MapPin, ScrollText } from 'lucide-react'

// Questions de départ : les composants restent génériques et ne connaissent pas le contenu métier.
export const suggestions = [
  { label: 'Quels documents pour renouveler ma carte d’identité ?', icon: IdCard },
  { label: 'Comment obtenir un extrait d’acte de naissance ?', icon: ScrollText },
  { label: 'Où se trouve le service de l’état civil ?', icon: MapPin },
  { label: 'Aidez-moi à remplir un formulaire de demande', icon: FileCheck2 },
]
