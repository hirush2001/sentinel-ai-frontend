import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, AlertOctagon, ArrowUpRight, Bot, Boxes, Clock3, Cpu, Globe2, RefreshCw, ShieldAlert, ShieldCheck, Siren, Zap } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { agentPresence, formatDate, severityTone, timeAgo, toTitle } from '../lib/format'
import { Badge, Card, CardHeading, EmptyState, ErrorState, LoadingState, PageHeader, StatCard } from '../components/ui'

const SEVERITY_COLORS = { critical: '#fb7185', high: '#f97373', medium: '#fbbf24', low: '#55e6b0', info: '#64748b' }

function buildTrend(events) {
  const now = new Date()
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    return { key: date.toDateString(), day: date.toLocaleDateString(undefined, { weekday: 'short' }), total: 0, high: 0 }
  })
  const map = new Map(days.map((item) => [item.key, item]))
  events.forEach((event) => {
    const date = new Date(event.last_seen || event.created_at)
    const item = map.get(new Date(date.getFullYear(), date.getMonth(), date.getDate()).toDateString())
    if (item) { item.total += 1; if (['high', 'critical'].includes(event.severity)) item.high += 1 }
  })
  return days
}

export default function OverviewPage() {
  const { token, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [events, setEvents] = useState([])
  const [agents, setAgents] = useState([])
  const [incidents, setIncidents] = useState([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setBusy(true); setError('')
    try {
      const [summary, eventRows, incidentRows, agentRows] = await Promise.all([
        api.dashboard(token), api.events(token, { limit: 50 }),
        isAdmin ? api.incidents(token, { limit: 8 }) : Promise.resolve([]),
        isAdmin ? api.agents(token) : Promise.resolve([]),
      ])
      setData(summary); setEvents(eventRows); setIncidents(incidentRows); setAgents(agentRows)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }, [token, isAdmin])

  useEffect(() => { load() }, [load])
  const trend = useMemo(() => buildTrend(events), [events])
  const severityData = useMemo(() => ['critical','high','medium','low','info'].map((key) => ({ name: toTitle(key), value: events.filter((e) => e.severity === key).length, color: SEVERITY_COLORS[key] })).filter((x) => x.value > 0), [events])

  if (busy && !data) return <LoadingState label="Loading security overview…"/>
  if (error && !data) return <ErrorState message={error} onRetry={load}/>

  return <>
    <PageHeader eyebrow="Command overview" title="Security at a glance" description="A live view of your endpoint fleet, recent detections and investigation workload." actions={<button className="btn-secondary" onClick={load}><RefreshCw size={14}/> Refresh data</button>}/>
    {error && <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/[.07] p-3 text-xs text-rose-200">Some overview data could not be refreshed: {error}</div>}
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard label="Total security events" value={data?.events_total ?? 0} detail="All recorded event groups" icon={Activity} tone="cyan"/>
      <StatCard label="Critical events" value={data?.events_critical ?? 0} detail="Requires immediate review" icon={AlertOctagon} tone="rose"/>
      <StatCard label="Active endpoint agents" value={data?.endpoint_agents_active ?? 0} detail={`${data?.endpoint_agents_total ?? 0} enrolled in total`} icon={Cpu} tone="mint"/>
      <StatCard label="Open incidents" value={data?.open_incidents ?? 0} detail="Open or being investigated" icon={ShieldAlert} tone="amber"/>
    </div>
    <div className="mt-4 grid grid-cols-1 gap-4 2xl:grid-cols-[1.55fr_1fr]">
      <Card>
        <CardHeading title="Event activity" subtitle="Recent seven-day activity from the latest 50 event groups" icon={Activity}/>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs><linearGradient id="eventFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#55e6b0" stopOpacity={.24}/><stop offset="100%" stopColor="#55e6b0" stopOpacity={0}/></linearGradient><linearGradient id="highFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fb7185" stopOpacity={.2}/><stop offset="100%" stopColor="#fb7185" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid stroke="#1d2c42" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="day" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background:'#101c2c', border:'1px solid #293b52', borderRadius:12, color:'#e7edf6', fontSize:12 }} labelStyle={{ color:'#94a3b8' }}/><Area type="monotone" dataKey="total" name="Events" stroke="#55e6b0" strokeWidth={2.5} fill="url(#eventFill)"/><Area type="monotone" dataKey="high" name="High / critical" stroke="#fb7185" strokeWidth={1.7} fill="url(#highFill)"/>
          </AreaChart></ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <CardHeading title="Severity distribution" subtitle="Severity mix across the latest 50 events" icon={Siren}/>
        {severityData.length ? <div className="flex h-[260px] items-center gap-2"><div className="h-full min-w-0 flex-1"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={severityData} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="86%" paddingAngle={3} stroke="none">{severityData.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip contentStyle={{ background:'#101c2c', border:'1px solid #293b52', borderRadius:12, color:'#e7edf6', fontSize:12 }}/></PieChart></ResponsiveContainer></div><div className="w-[122px] shrink-0 space-y-3">{severityData.map((item) => <div key={item.name} className="flex items-center justify-between gap-2 text-xs"><span className="flex items-center gap-2 text-slate-400"><span className="h-2 w-2 rounded-full" style={{ background:item.color }}/>{item.name}</span><b className="text-slate-200">{item.value}</b></div>)}</div></div> : <EmptyState icon={ShieldCheck} title="No recent events" description="Events will appear here after endpoint telemetry is received."/>}
      </Card>
    </div>
    <div className="mt-4 grid grid-cols-1 gap-4 2xl:grid-cols-[1.45fr_1fr]">
      <Card padding="p-0">
        <div className="p-5 pb-3"><CardHeading title="Recent security activity" subtitle="Latest event groups received by Sentinel AI" icon={ShieldAlert} action={<button className="btn-ghost !px-2 !py-1.5 text-xs" onClick={() => navigate('/events')}>View all <ArrowUpRight size={13}/></button>}/></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[600px]"><thead><tr><th className="table-head px-5 py-3">Severity</th><th className="table-head px-3 py-3">Event</th><th className="table-head px-3 py-3">Source</th><th className="table-head px-5 py-3 text-right">Last seen</th></tr></thead><tbody>{events.slice(0,6).map((event) => <tr key={event.id} className="hover:bg-white/[.02]"><td className="table-cell px-5"><Badge tone={severityTone(event.severity)}>{event.severity}</Badge></td><td className="table-cell max-w-[310px] truncate px-3"><div className="font-bold text-slate-200">{event.message}</div><div className="mt-1 font-mono text-[10px] text-slate-600">{event.event_type}</div></td><td className="table-cell px-3 font-mono text-[11px] text-slate-500">{event.source}</td><td className="table-cell px-5 text-right text-xs text-slate-500">{timeAgo(event.last_seen)}</td></tr>)}</tbody></table>{!events.length && <EmptyState icon={Activity} title="No security events yet" description="The first uploaded agent events will appear here."/>}</div>
      </Card>
      <Card>
        <CardHeading title="Endpoint fleet" subtitle="Heartbeat recency from enrolled agents" icon={Cpu} action={<button className="btn-ghost !px-2 !py-1.5 text-xs" onClick={() => navigate('/fleet')}>Open 3D fleet <ArrowUpRight size={13}/></button>}/>
        {isAdmin && agents.length ? <div className="space-y-3">{agents.slice(0,5).map((agent) => { const presence = agentPresence(agent); return <div key={agent.id} className="flex items-center gap-3 rounded-xl border border-line/70 bg-[#0a1422] p-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/[.07] text-cyan-200"><Cpu size={16}/></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-slate-200">{agent.display_name}</div><div className="mt-1 truncate font-mono text-[10px] text-slate-600">{agent.hostname} · {timeAgo(agent.last_seen)}</div></div><Badge tone={presence.tone} dot>{presence.label}</Badge></div>})}</div> : <EmptyState icon={Boxes} title="No enrolled endpoints" description="Create a one-time enrollment token and connect your first Windows agent." action={<button className="btn-secondary" onClick={() => navigate('/agents')}>Manage agents</button>}/>}
        <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl border border-line/70 bg-[#0a1422] p-3"><div className="text-[10px] text-slate-500">External AI calls today</div><div className="mt-1 text-xl font-extrabold text-white">{data?.external_ai_calls_today ?? 0}</div></div><div className="rounded-xl border border-line/70 bg-[#0a1422] p-3"><div className="text-[10px] text-slate-500">Active indicators</div><div className="mt-1 text-xl font-extrabold text-white">{data?.active_threat_indicators ?? 0}</div></div></div>
      </Card>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/60 bg-[#0c1624] px-4 py-3 text-[11px] text-slate-500"><div className="flex items-center gap-2"><Clock3 size={14}/> Summary reflects the backend response at the last refresh.</div><div className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-300"/> Routine monitoring does not call an AI API.</div></div>
  </>
}
