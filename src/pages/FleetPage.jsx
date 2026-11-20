import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowUpRight, Cpu, RefreshCw, Server, ShieldCheck, Signal, Wifi, WifiOff } from 'lucide-react'
import { api } from '../lib/api'
import { agentPresence, formatDate, shortId, timeAgo } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Agent3DScene from '../components/Agent3DScene'
import { Badge, Card, CardHeading, EmptyState, ErrorState, LoadingState, PageHeader, StatCard } from '../components/ui'

export default function FleetPage() {
  const { token, isAdmin } = useAuth()
  const toast = useToast()
  const [agents, setAgents] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (silent = false) => {
    if (!isAdmin) { setBusy(false); return }
    if (!silent) setBusy(true)
    setError('')
    try {
      const rows = await api.agents(token)
      setAgents(rows)
      setSelectedId((current) => rows.some((a) => a.id === current) ? current : (rows[0]?.id ?? null))
    } catch (err) { setError(err.message) }
    finally { if (!silent) setBusy(false) }
  }, [token, isAdmin])

  useEffect(() => { load(); const timer = window.setInterval(() => load(true), 30000); return () => window.clearInterval(timer) }, [load])
  const selected = useMemo(() => agents.find((agent) => agent.id === selectedId) || null, [agents, selectedId])
  const presenceCounts = useMemo(() => agents.reduce((acc, agent) => { const presence = agentPresence(agent); acc[presence.tone] = (acc[presence.tone] || 0) + 1; return acc }, {}), [agents])

  if (!isAdmin) return <EmptyState icon={ShieldCheck} title="Administrator access required" description="The endpoint fleet API is restricted to administrator accounts."/>
  if (busy && !agents.length && !error) return <LoadingState label="Loading endpoint fleet…"/>
  if (error && !agents.length) return <ErrorState message={error} onRetry={load}/>

  return <>
    <PageHeader eyebrow="Endpoint operations" title="3D agent fleet" description="Explore enrolled Windows endpoints as detailed workstation models. Animated links represent the agent-to-backend telemetry path; status is derived from the latest backend heartbeat." actions={<button className="btn-secondary" onClick={() => load()}><RefreshCw size={14}/> Refresh fleet</button>}/>
    <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard label="Enrolled endpoints" value={agents.length} icon={Cpu} tone="cyan"/>
      <StatCard label="Recently seen" value={presenceCounts.success || 0} detail="Heartbeat within 3 minutes" icon={Signal} tone="mint"/>
      <StatCard label="Delayed heartbeat" value={presenceCounts.warning || 0} icon={Wifi} tone="amber"/>
      <StatCard label="Stale / unavailable" value={(presenceCounts.danger || 0) + (presenceCounts.muted || 0)} icon={WifiOff} tone="rose"/>
    </div>
    <Agent3DScene agents={agents} selectedId={selectedId} onSelect={setSelectedId}/>
    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_.8fr]">
      <Card padding="p-0">
        <div className="p-5 pb-2"><CardHeading title="Enrolled endpoints" subtitle="Select a workstation in the scene or choose a device below" icon={Server}/></div>
        {agents.length ? <div className="divide-y divide-line/60">{agents.map((agent) => { const presence = agentPresence(agent); return <button key={agent.id} onClick={() => setSelectedId(agent.id)} className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-white/[.03] ${selectedId === agent.id ? 'bg-emerald-300/[.045]' : ''}`}><div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${selectedId === agent.id ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : 'border-line bg-[#101c2c] text-slate-500'}`}><Cpu size={16}/></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-extrabold text-slate-200">{agent.display_name}</div><div className="mt-1 truncate font-mono text-[10px] text-slate-600">{agent.hostname} · {shortId(agent.agent_uuid, 13)}</div></div><div className="hidden text-right sm:block"><div className="text-[10px] text-slate-500">{timeAgo(agent.last_seen)}</div><div className="mt-1"><Badge tone={presence.tone} dot>{presence.label}</Badge></div></div><ArrowUpRight size={14} className="text-slate-600"/></button>})}</div> : <EmptyState icon={Cpu} title="No endpoints enrolled" description="Create an enrollment token in Endpoint agents to connect a Windows computer."/>}
      </Card>
      <Card>
        <CardHeading title="Selected endpoint" subtitle="Live identity and heartbeat details" icon={Activity}/>
        {selected ? <div className="space-y-4">
          <div><div className="text-lg font-extrabold text-white">{selected.display_name}</div><div className="mt-1 font-mono text-xs text-slate-500">{selected.hostname}</div></div>
          <div className="flex flex-wrap gap-2"><Badge tone={selected.status === 'active' ? 'success' : selected.status === 'paused' ? 'warning' : 'danger'}>{selected.status}</Badge><Badge tone={agentPresence(selected).tone} dot>{agentPresence(selected).label}</Badge></div>
          <div className="grid grid-cols-2 gap-2">{[
            ['Platform', selected.os_platform], ['OS version', selected.os_version], ['Architecture', selected.architecture], ['Agent version', selected.agent_version], ['Last IP', selected.last_ip || '—'], ['Last heartbeat', timeAgo(selected.last_seen)],
          ].map(([label,value]) => <div key={label} className="rounded-xl border border-line/70 bg-[#0a1422] p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</div><div className="mt-1 break-words text-xs font-semibold text-slate-300">{value}</div></div>)}</div>
          <div className="rounded-xl border border-line/70 bg-[#0a1422] p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Agent UUID</div><div className="mt-1 break-all font-mono text-[10px] text-slate-400">{selected.agent_uuid}</div></div>
          <div className="text-[10px] leading-5 text-slate-600">Enrolled {formatDate(selected.enrolled_at)}. Heartbeat recency is estimated from <span className="font-mono">last_seen</span>; the backend does not expose a separate real-time online flag.</div>
        </div> : <EmptyState icon={Cpu} title="Select an endpoint" description="Choose a workstation from the 3D scene or endpoint list."/>}
      </Card>
    </div>
  </>
}
