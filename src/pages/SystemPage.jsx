import { useEffect, useState } from 'react'
import { Activity, ArrowUpRight, CheckCircle2, Database, ExternalLink, Globe2, KeyRound, RefreshCw, Server, ShieldCheck, Zap } from 'lucide-react'
import { api, getApiOrigin } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Badge, Card, CardHeading, EmptyState, PageHeader, StatCard } from '../components/ui'

export default function SystemPage() {
  const { token, user, isAdmin } = useAuth()
  const [health, setHealth] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  async function load() {
    if (!isAdmin) { setLoading(false); return }
    setLoading(true); setError('')
    try { const [h,s] = await Promise.all([api.health(), api.dashboard(token)]); setHealth(h); setSummary(s) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [token, isAdmin])
  const backendBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8000'

  if (!isAdmin) return <EmptyState icon={ShieldCheck} title="Administrator access required" description="System diagnostics are restricted to administrators."/>

  return <>
    <PageHeader eyebrow="Platform administration" title="System status" description="Backend connectivity, database health and the integration settings for this standalone frontend." actions={<button className="btn-secondary" onClick={load}><RefreshCw size={14}/> Refresh checks</button>}/>
    {error && <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/[.06] p-3 text-xs text-rose-200">{error}</div>}
    <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4"><StatCard label="API status" value={health?.status === 'healthy' ? 'Healthy' : health?.status || 'Unknown'} icon={Activity} tone={health?.status === 'healthy' ? 'mint' : 'rose'} loading={loading}/><StatCard label="Database" value={health?.database || '—'} icon={Database} tone={health?.database === 'connected' ? 'mint' : 'amber'} loading={loading}/><StatCard label="AI models hosted locally" value={health?.local_ai_models === false ? 'No' : '—'} icon={Zap} tone="cyan" loading={loading}/><StatCard label="Redis cache" value={health?.redis === false ? 'Not used' : '—'} icon={Server} tone="slate" loading={loading}/></div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card><CardHeading title="Backend connection" subtitle="Current API health response" icon={Server}/><div className="space-y-3">{[['Service',health?.service],['Database engine',health?.database_engine],['Endpoint agent support',health?.endpoint_agent_supported ? 'Enabled' : 'Unknown'],['Signed-in account',user?.email],['Role',user?.role]].map(([label,value]) => <div key={label} className="flex items-center justify-between gap-3 border-b border-line/60 pb-2.5"><span className="text-xs text-slate-500">{label}</span><span className="text-right text-xs font-bold text-slate-200">{value ?? '—'}</span></div>)}</div><div className="mt-4 rounded-xl border border-line bg-[#0a1422] p-3"><div className="eyebrow">Backend origin</div><div className="mt-1 break-all font-mono text-xs text-cyan-200">{backendBase}</div></div><a className="btn-secondary mt-4 w-full" href={`${backendBase.replace(/\/$/,'')}/docs`} target="_blank" rel="noreferrer">Open FastAPI Swagger <ExternalLink size={14}/></a></Card>
      <Card><CardHeading title="Frontend integration" subtitle="This frontend is separate from the FastAPI backend" icon={Globe2}/><div className="space-y-4 text-xs leading-5 text-slate-400"><div><div className="mb-1 font-bold text-slate-200">Development mode</div>By default, Vite proxies <code className="text-emerald-200">/api</code> to <code className="text-emerald-200">http://127.0.0.1:8000</code>. Start your backend first, then start this frontend on port 5173.</div><div><div className="mb-1 font-bold text-slate-200">Remote backend</div>Set <code className="text-emerald-200">VITE_API_BASE_URL</code> to the backend HTTPS origin. Add the frontend origin to the backend's <code className="text-emerald-200">CORS_ORIGINS</code> setting and restart FastAPI.</div><div><div className="mb-1 font-bold text-slate-200">Authentication</div>The access token is kept in React memory only. A browser refresh clears it and requires a new sign-in.</div><div><div className="mb-1 font-bold text-slate-200">Data source</div>All dashboard values and actions come from the existing API. The 3D view uses real enrolled agent records and their <code className="text-emerald-200">last_seen</code> heartbeat timestamp.</div></div><div className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[.04] p-3 text-xs leading-5 text-emerald-100/70"><div className="mb-1 flex items-center gap-2 font-bold text-emerald-200"><ShieldCheck size={14}/> No backend changes required</div>Frontend routes call the existing <code>/api/v1</code> endpoints. No database migration or new backend service is included.</div></Card>
    </div>
    <div className="mt-4"><Card><CardHeading title="Platform controls" subtitle="Values returned by the authenticated dashboard summary" icon={KeyRound}/><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Enrolled agents',summary?.endpoint_agents_total],['Open incidents',summary?.open_incidents],['Active indicators',summary?.active_threat_indicators],['Pending approvals',summary?.pending_permission_requests]].map(([label,value]) => <div key={label} className="rounded-xl border border-line bg-[#0a1422] p-3"><div className="text-[10px] text-slate-500">{label}</div><div className="mt-1 text-xl font-extrabold text-white">{value ?? '—'}</div></div>)}</div></Card></div>
  </>
}
