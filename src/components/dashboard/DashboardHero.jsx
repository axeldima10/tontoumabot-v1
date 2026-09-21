import React from 'react'
import BotMark from '../brand/BotMark'
import '../../css/DashboardHero.css'

// Présente le contexte de la page et les retours d'action envoyés par le hook du dashboard.
function DashboardHero({ sentQuestion, notice, assistantResponse, isStreaming }) {
  return (
    <header className="hero">
      <div className="hero-mark"><BotMark /></div>
      <p className="eyebrow">BON RETOUR</p>
      <h1>Comment puis-je vous aider aujourd’hui ?</h1>
      {sentQuestion && <p className="sent-note" role="status">Votre demande : « {sentQuestion} »</p>}
      {assistantResponse && <p className="assistant-response" role="status">{assistantResponse}{isStreaming && <span className="response-cursor" aria-hidden="true">|</span>}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}
    </header>
  )
}

export default DashboardHero
