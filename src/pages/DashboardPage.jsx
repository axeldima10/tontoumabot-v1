import DashboardHero from '../components/dashboard/DashboardHero'
import FeatureCards from '../components/dashboard/FeatureCards'
import QuestionComposer from '../components/dashboard/QuestionComposer'
import SessionControls from '../components/dashboard/SessionControls'
import Topbar from '../components/dashboard/Topbar'
import VoiceScreen from '../components/dashboard/VoiceScreen'
import { useTheme } from '../context/ThemeContext'
import useDashboard from '../hooks/useDashboard'
import '../css/DashboardPage.css'

// Page-orchestratrice : elle assemble les composants et relie leurs événements au hook métier.
function DashboardPage() {
  const { dark } = useTheme()
  const dashboard = useDashboard()

  // La classe dark est portée par la racine visuelle afin que les variables CSS se propagent partout.
  return (
    <main className={`app-shell ${dark ? 'dark' : ''}`}>
      <section className="main-panel">
        <Topbar />
        <div className="content">
          <DashboardHero
            sentQuestion={dashboard.sentQuestion}
            notice={dashboard.notice}
            assistantResponse={dashboard.assistantResponse}
            isStreaming={dashboard.isStreaming}
          />
          <QuestionComposer
            {...dashboard}
            onChange={dashboard.setQuestion}
            onSubmit={dashboard.submitQuestion}
            onVoiceOpen={dashboard.openVoice}
          />
          {dashboard.voiceOpen && (
            <VoiceScreen
              language={dashboard.voiceLanguage}
              onLanguageChange={dashboard.cycleVoiceLanguage}
              onClose={dashboard.closeVoice}
            />
          )}
          <FeatureCards onSelect={dashboard.selectFeature} />
        </div>
      </section>
      <SessionControls onEndSession={dashboard.endSession} />
    </main>
  )
}

export default DashboardPage
