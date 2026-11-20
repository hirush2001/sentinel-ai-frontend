import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, AlertTriangle, Boxes, BrainCircuit, ChevronLeft, ChevronRight, CircleDot,
  Command, Cpu, FileSearch, Gauge, GitBranch, Globe2, LayoutDashboard, LogOut,
  Menu, Network, Radar, Shield, ShieldAlert, ShieldCheck, SlidersHorizontal, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Badge } from './ui'

const primaryNav = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: '3D agent fleet', path: '/fleet', icon: Boxes, accent: true },
  { label: 'Endpoint agents', path: '/agents', icon: Cpu },
  { label: 'Security events', path: '/events', icon: Activity },
  { label: 'Process monitor', path: '/processes', icon: Radar },
  { label: 'Incidents', path: '/incidents', icon: ShieldAlert },
]
const intelNav = [
  { label: 'Network security', path: '/network', icon: Globe2 },
  { label: 'Threat intelligence', path: '/threat-intel', icon: ShieldCheck },
  { label: 'AI investigations', path: '/investigations', icon: BrainCircuit },
  { label: 'Response approvals', path: '/response', icon: GitBranch },
]

function SideLink({ item, collapsed, onClick }) {
  const Icon = item.icon
  return <NavLink to={item.path} end={item.path === '/'} onClick={onClick} title={collapsed ? item.label : undefined} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''} ${item.accent && !isActive ? 'text-emerald-300/80' : ''} ${collapsed ? 'justify-center px-2' : ''}`}>
    <Icon size={17} strokeWidth={1.8}/>{!collapsed && <span className="truncate">{item.label}</span>}{!collapsed && item.accent && <span className="ml-auto rounded bg-emerald-300/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-200">3D</span>}
  </NavLink>
}

export default function AppShell() {
  const { user, signOut, isAdmin } = useAuth()
  const [health, setHealth] = useState('checking')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let alive = true
    const check = async () => {
      try { const result = await api.health(); if (alive) setHealth(result.status === 'healthy' ? 'healthy' : 'unhealthy') }
      catch { if (alive) setHealth('unhealthy') }
    }
    check()
    const interval = window.setInterval(check, 30000)
    return () => { alive = false; window.clearInterval(interval) }
  }, [location.pathname])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const adminOnlyPaths = new Set(['/fleet', '/agents', '/processes', '/incidents', '/network', '/threat-intel'])
  const navGroups = [
    { label: 'Workspace', items: primaryNav.filter((item) => isAdmin || !adminOnlyPaths.has(item.path)) },
    { label: 'Intelligence & response', items: intelNav.filter((item) => isAdmin || !adminOnlyPaths.has(item.path)) },
  ]

  const sidebar = <aside className={`flex h-full flex-col border-r border-line/80 bg-[#0a1321] ${collapsed ? 'w-[76px]' : 'w-[250px]'} transition-all duration-200`}>
    <div className={`flex h-[76px] items-center border-b border-line/70 px-5 ${collapsed ? 'justify-center px-2' : 'gap-3'}`}>
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-200"><Shield size={19}/><span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0a1321] bg-emerald-300"/></div>
      {!collapsed && <div className="min-w-0"><div className="text-[14px] font-extrabold tracking-[.13em] text-white">SENTINEL<span className="text-emerald-300"> AI</span></div><div className="mt-0.5 text-[9px] font-bold uppercase tracking-[.19em] text-slate-600">Security operations</div></div>}
    </div>
    <div className="flex-1 overflow-y-auto px-3 py-5">
      {navGroups.map((group) => <div key={group.label} className="mb-6">{!collapsed && <div className="mb-2 px-3 text-[9px] font-extrabold uppercase tracking-[.18em] text-slate-600">{group.label}</div>}<div className="space-y-1">{group.items.map((item) => <SideLink key={item.path} item={item} collapsed={collapsed}/>)}</div></div>)}
      {isAdmin && <div className="mb-6">{!collapsed && <div className="mb-2 px-3 text-[9px] font-extrabold uppercase tracking-[.18em] text-slate-600">Administration</div>}<SideLink item={{ label: 'System status', path: '/system', icon: SlidersHorizontal }} collapsed={collapsed}/></div>}
    </div>
    <div className="border-t border-line/70 p-3">
      {!collapsed && <div className="mb-3 rounded-xl border border-line/70 bg-[#101c2d] p-3"><div className="flex items-center justify-between"><span className="text-[10px] font-bold text-slate-500">BACKEND STATUS</span><span className={`h-2 w-2 rounded-full ${health === 'healthy' ? 'bg-emerald-300 shadow-[0_0_12px_#55e6b0]' : health === 'checking' ? 'bg-amber-300' : 'bg-rose-400'}`}/></div><div className="mt-2 flex items-center gap-2">{health === 'healthy' ? <Badge tone="success">Connected</Badge> : health === 'checking' ? <Badge tone="warning">Checking</Badge> : <Badge tone="danger">Unavailable</Badge>}<span className="text-[10px] text-slate-600">API · PostgreSQL</span></div></div>}
      <button onClick={() => { signOut(); navigate('/login') }} className={`nav-link w-full hover:text-rose-300 ${collapsed ? 'justify-center px-2' : ''}`}><LogOut size={17}/>{!collapsed && 'Sign out'}</button>
      <button onClick={() => setCollapsed((v) => !v)} className="mt-2 hidden w-full items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-white/5 hover:text-white lg:flex">{collapsed ? <ChevronRight size={15}/> : <ChevronLeft size={15}/>}</button>
    </div>
  </aside>

  return <div className="min-h-screen bg-ink text-slate-100">
    <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>
    {mobileOpen && <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={() => setMobileOpen(false)}><div className="h-full w-[270px]" onClick={(e) => e.stopPropagation()}>{sidebar}</div></div>}
    <div className={`${collapsed ? 'lg:pl-[76px]' : 'lg:pl-[250px]'} min-h-screen transition-all duration-200`}>
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-line/70 bg-[#080f1c]/90 px-4 backdrop-blur-xl sm:px-7">
        <div className="flex items-center gap-3"><button className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={19}/></button><div className="hidden h-8 w-px bg-line sm:block"/><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-600">Sentinel AI / Control center</div><div className="mt-0.5 text-xs font-semibold text-slate-300">Defensive endpoint monitoring</div></div></div>
        <div className="flex items-center gap-3 sm:gap-5"><div className="hidden items-center gap-2 sm:flex"><span className={`h-1.5 w-1.5 rounded-full ${health === 'healthy' ? 'bg-emerald-300' : 'bg-rose-400'}`}/><span className="text-[11px] font-semibold text-slate-500">{health === 'healthy' ? 'Backend operational' : health === 'checking' ? 'Checking backend' : 'Backend unreachable'}</span></div><div className="h-7 w-px bg-line"/><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-[11px] font-extrabold text-cyan-200">{(user?.email || 'U').slice(0,1).toUpperCase()}</div><div className="hidden sm:block"><div className="max-w-[160px] truncate text-xs font-bold text-slate-200">{user?.email}</div><div className="text-[10px] capitalize text-slate-500">{user?.role || 'user'}</div></div></div></div>
      </header>
      <main className="mx-auto max-w-[1680px] px-4 py-6 sm:px-7 sm:py-8"><Outlet/></main>
      <footer className="border-t border-line/50 px-6 py-4 text-center text-[10px] text-slate-700">Sentinel AI · Defensive monitoring prototype · Human approval required for system-changing actions</footer>
    </div>
  </div>
}
