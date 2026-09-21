import { useState } from 'react'
import { Check, Clock3, FileCheck2, MapPin, WalletCards } from 'lucide-react'
import '../../css/ProcedureMemo.css'

const documents = ['Pièce d’identité en cours de validité', 'Justificatif de domicile', 'Deux photos d’identité']

// Mémo affiché après l'envoi : il possède son propre état local pour la checklist.
function ProcedureMemo({ question }) {
  const [checkedDocuments, setCheckedDocuments] = useState([])

  function toggleDocument(document) {
    // On ajoute ou retire le document sans modifier directement le tableau précédent.
    setCheckedDocuments((current) => current.includes(document)
      ? current.filter((item) => item !== document)
      : [...current, document])
  }

  return (
    <section className="result-area" aria-label="Résumé de votre démarche">
      <div className="memo-card">
        <div className="memo-heading">
          <span className="memo-icon"><FileCheck2 /></span>
          <div>
            <p className="section-kicker">FICHE MÉMO</p>
            <h2>Synthèse de votre demande</h2>
          </div>
          <span className="memo-status">Préparée</span>
        </div>
        <p className="memo-context">À partir de votre demande : « {question} »</p>
        <div className="memo-facts">
          <div><WalletCards /><span>Conditions<strong>À confirmer</strong></span></div>
          <div><Clock3 /><span>Délai indicatif<strong>7 à 10 jours</strong></span></div>
          <div><MapPin /><span>Point de service<strong>Zone B</strong></span></div>
        </div>
        <div className="checklist">
          <div className="checklist-title"><strong>À préparer</strong><span>{checkedDocuments.length}/{documents.length}</span></div>
          {documents.map((document) => (
            <label className="check-item" key={document}>
              <input type="checkbox" checked={checkedDocuments.includes(document)} onChange={() => toggleDocument(document)} />
              <span className="check-box"><Check /></span>
              <span>{document}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="orientation-card">
        <div className="orientation-heading">
          <span className="memo-icon"><MapPin /></span>
          <div><p className="section-kicker">POUR VOUS ORIENTER</p><h2>Suivez le repère vert</h2></div>
        </div>
        <div className="building-map" role="img" aria-label="Plan simplifié vers la zone B">
          <span className="map-label entrance">Départ</span>
          <span className="map-label destination">Zone B</span>
          <svg viewBox="0 0 320 170" aria-hidden="true">
            <path className="map-room" d="M18 20h100v52H18zM138 20h164v52H138zM18 94h78v58H18zM112 94h80v58h-80zM208 94h94v58h-94z" />
            <path className="map-route" d="M58 154V119h91V72h88V45" />
            <circle className="map-start" cx="58" cy="154" r="5" />
            <circle className="map-end" cx="237" cy="45" r="6" />
          </svg>
        </div>
        <p className="orientation-note">Depuis le point d’accueil, suivez le couloir principal puis prenez la deuxième direction.</p>
      </div>
    </section>
  )
}

export default ProcedureMemo
