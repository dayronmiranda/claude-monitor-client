import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { HostsPage } from '@/components/hosts/HostsPage'
import { ProjectsPage } from '@/components/projects/ProjectsPage'
import { SessionsPage } from '@/components/sessions/SessionsPage'
import { SessionMessagesPage } from '@/components/sessions/SessionMessagesPage'
import { RealSessionMonitorPage } from '@/components/sessions/RealSessionMonitorPage'
import { TerminalsPage } from '@/components/terminals/TerminalsPage'
import { TerminalView } from '@/components/terminals/TerminalView'
import { JobsPage } from '@/components/jobs/JobsPage'
import { JobDetailPage } from '@/components/jobs/JobDetailPage'
import { AnalyticsPage } from '@/components/analytics/AnalyticsPage'
import { SettingsPage } from '@/components/settings/SettingsPage'
import { initializeConnections } from '@/stores/useStore'

function App() {
  useEffect(() => {
    // Initialize connections to saved hosts on app load
    initializeConnections()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HostsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectPath" element={<SessionsPage />} />
          <Route path="projects/:projectPath/sessions/:sessionId/messages" element={<SessionMessagesPage />} />
          <Route path="projects/:projectPath/sessions/:sessionId/realtime" element={<RealSessionMonitorPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/:jobId" element={<JobDetailPage />} />
          <Route path="terminals" element={<TerminalsPage />} />
          <Route path="terminals/:terminalId" element={<TerminalView />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
