import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppShell from './components/AppShell'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import FleetPage from './pages/FleetPage'
import AgentsPage from './pages/AgentsPage'
import EventsPage from './pages/EventsPage'
import ProcessesPage from './pages/ProcessesPage'
import IncidentsPage from './pages/IncidentsPage'
import NetworkPage from './pages/NetworkPage'
import ThreatIntelPage from './pages/ThreatIntelPage'
import InvestigationsPage from './pages/InvestigationsPage'
import ResponsePage from './pages/ResponsePage'
import SystemPage from './pages/SystemPage'
import { EmptyState } from './components/ui'
import { ShieldAlert } from 'lucide-react'

function Protected({ children }) {
  const { token } = useAuth()
  const location = useLocation()
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }}/>
  return children
}

function NotFound() {
  return <div className="flex min-h-[60vh] items-center justify-center"><EmptyState icon={ShieldAlert} title="Page not found" description="The page you requested does not exist."/></div>
}

export default function App() {
  const { token } = useAuth()
  return <Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/" element={<Protected><AppShell/></Protected>}>
      <Route index element={<OverviewPage/>}/>
      <Route path="fleet" element={<FleetPage/>}/>
      <Route path="agents" element={<AgentsPage/>}/>
      <Route path="events" element={<EventsPage/>}/>
      <Route path="processes" element={<ProcessesPage/>}/>
      <Route path="incidents" element={<IncidentsPage/>}/>
      <Route path="network" element={<NetworkPage/>}/>
      <Route path="threat-intel" element={<ThreatIntelPage/>}/>
      <Route path="investigations" element={<InvestigationsPage/>}/>
      <Route path="response" element={<ResponsePage/>}/>
      <Route path="system" element={<SystemPage/>}/>
    </Route>
    <Route path="*" element={<NotFound/>}/>
  </Routes>
}
