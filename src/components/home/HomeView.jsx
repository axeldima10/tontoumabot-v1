import { useRef } from 'react'
import { ArrowUpRight, AudioLines, ChevronRight, MessageCircle, MessageSquareText, Sparkles } from 'lucide-react'
import botImage from '../../assets/images/tontuma-bot.png'
import { suggestions } from '../../data/dashboardData'
import { viewHref } from '../../hooks/useHashView'
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap'
import AppHeader from '../layout/AppHeader'
import { ThemeToggle } from '../layout/ThemeControls'
import '../../css/HomeView.css'

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

function greetingFor(hour) {
  if (hour >= 5 && hour < 12) return 'Bonjour'
  if (hour >= 12 && hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

function initialsOf(user) {
  const source = user.firstName || user.name || ''
  return source.trim().slice(0, 1).toUpperCase()
}

// Lumière qui suit le pointeur sur les cartes en verre ; posée via des variables CSS, sans re-rendu.
function trackSpotlight(event) {
  const card = event.target.closest('[data-spotlight]')
  if (!card) return
  const rect = card.getBoundingClientRect()
  card.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  card.style.setProperty('--my', `${event.clientY - rect.top}px`)
}

// Tableau de bord : accueil personnalisé, deux actions principales et reprises rapides.
function HomeView({ user, recents, onMenu, onSuggestion, onOpenRecent, onOpenAccount }) {
  const rootRef = useRef(null)
  const now = new Date()
  const firstName = user?.firstName || user?.name?.split(' ')[0]

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const tl = gsap.timeline({ defaults: { duration: 0.7, ease: 'power3.out' } })
      tl.from('[data-anim="header"]', { y: -14, autoAlpha: 0, duration: 0.5 })
        .from('.home-greeting > *', { y: 22, autoAlpha: 0, stagger: 0.08 }, '-=0.25')
        .from('.hero-card', { y: 30, autoAlpha: 0, scale: 0.97 }, '-=0.45')
        .from('.hero-bot', { scale: 0.55, rotation: -10, autoAlpha: 0, duration: 1, ease: 'back.out(1.7)' }, '-=0.45')
        .from('.hero-copy > *', { y: 16, autoAlpha: 0, stagger: 0.07 }, '<0.1')
        .from('.action-card', { y: 30, autoAlpha: 0, stagger: 0.1 }, '-=0.7')
        .from('.home-panel', { y: 24, autoAlpha: 0 }, '-=0.55')
        .from('.home-list-item', { x: -14, autoAlpha: 0, stagger: 0.06, duration: 0.5 }, '-=0.4')

      // Le robot flotte doucement pour donner de la présence à l'assistant.
      gsap.to('.hero-bot-float', { y: -10, rotation: 2.5, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      gsap.to('.hero-halo', { scale: 1.12, autoAlpha: 0.65, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    })
    return () => mm.revert()
  }, { scope: rootRef })

  return (
    <div className="home" ref={rootRef} onPointerMove={trackSpotlight}>
      <AppHeader
        title={<span translate="no">TONTOUMA-BOT</span>}
        aside={<span className="home-date">{dateFormatter.format(now)}</span>}
        onMenu={onMenu}
        right={<ThemeToggle className="only-mobile" />}
        className="home-header"
      />

      <section className="home-greeting" aria-labelledby="home-title">
        <div className="home-hello">
          {user ? (
            user.avatarUrl
              ? <img className="home-avatar" src={user.avatarUrl} alt="" width="44" height="44" />
              : <span className="home-avatar" aria-hidden="true">{initialsOf(user)}</span>
          ) : null}
          <p>
            <span>{greetingFor(now.getHours())}{firstName ? `, ${firstName}` : ''}</span>
            {user ? 'Heureux de vous revoir' : (
              <span className="home-guest">
                Mode invité ·{' '}
                <button type="button" onClick={onOpenAccount}>Se connecter</button>
                {' '}pour garder l’historique
              </span>
            )}
          </p>
        </div>
        <h1 id="home-title">Comment <span className="nowrap">puis-je</span> vous aider aujourd’hui&nbsp;?</h1>
      </section>

      <div className="home-grid">
        <div className="home-main">
          <article className="hero-card glass" data-spotlight>
            <div className="hero-copy">
              <p className="kicker">Accueil · Orientation · Démarches</p>
              <h2>Vos démarches administratives, simplifiées.</h2>
              <p>Je vous accueille, vous oriente et vous accompagne pas à pas, en français ou en wolof.</p>
              <a className="hero-cta" href={viewHref.chat}>
                Commencer
                <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
            <div className="hero-bot" aria-hidden="true">
              <span className="hero-halo" />
              <span className="hero-bot-float">
                <img src={botImage} alt="" width="432" height="430" fetchPriority="high" />
              </span>
            </div>
          </article>

          <div className="action-grid">
            <a className="action-card glass" href={viewHref.chat} data-spotlight>
              <span className="action-icon"><MessageSquareText aria-hidden="true" /></span>
              <ArrowUpRight className="action-arrow" aria-hidden="true" />
              <span className="action-text">
                <strong>Discuter avec Tontouma</strong>
                <span>Écrivez votre question</span>
              </span>
            </a>
            <a className="action-card glass" href={viewHref.voice} data-spotlight>
              <span className="action-icon"><AudioLines aria-hidden="true" /></span>
              <ArrowUpRight className="action-arrow" aria-hidden="true" />
              <span className="action-text">
                <strong>Parler à Tontouma</strong>
                <span>Posez-la à voix haute</span>
              </span>
            </a>
          </div>
        </div>

        <section className="home-panel glass" aria-labelledby="home-list-title">
          <div className="home-panel-head">
            <h2 id="home-list-title">{recents.length ? 'Reprendre' : 'Suggestions'}</h2>
            {recents.length ? <a href={viewHref.chat}>Voir tout</a> : <Sparkles aria-hidden="true" />}
          </div>
          <ul className="home-list">
            {recents.length
              ? recents.slice(0, 4).map((message) => (
                <li key={message.id}>
                  <button type="button" className="home-list-item" onClick={() => onOpenRecent(message.id)}>
                    <MessageCircle aria-hidden="true" />
                    <span>{message.content}</span>
                    <ChevronRight className="home-list-chevron" aria-hidden="true" />
                  </button>
                </li>
              ))
              : suggestions.map(({ label, icon: Icon }) => (
                <li key={label}>
                  <button type="button" className="home-list-item" onClick={() => onSuggestion(label)}>
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                    <ChevronRight className="home-list-chevron" aria-hidden="true" />
                  </button>
                </li>
              ))}
          </ul>
          <div className="home-langs">
            <span>Disponible en</span>
            <ul aria-label="Langues disponibles">
              <li>Français</li>
              <li>Wolof</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

export default HomeView
