import botMarkImage from '../../assets/images/tontuma-bot.png'
import '../../css/BotMark.css'

// Composant de marque réutilisable, avec une variante compacte pour les futurs emplacements.
function BotMark({ small = false }) {
  return (
    <div className={small ? 'bot-mark bot-mark-small' : 'bot-mark'}>
      <img src={botMarkImage} alt="TONTOUMA-BOT" />
    </div>
  )
}

export default BotMark
