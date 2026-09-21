import { ArrowUpRight } from 'lucide-react'
import { quickActions } from '../../data/dashboardData'
import '../../css/FeatureCards.css'

// Affiche les actions rapides et remonte le titre sélectionné à la page par onSelect.
function FeatureCards({ onSelect }) {
  return (
    <div className="feature-grid">
      {quickActions.map(({ title, description, icon: Icon }) => (
        <button className="feature-card" key={title} onClick={() => onSelect(title)}>
          <span className="feature-icon"><Icon /></span>
          <ArrowUpRight className="feature-arrow" />
          <strong>{title}</strong>
          <p>{description}</p>
        </button>
      ))}
    </div>
  )
}

export default FeatureCards
