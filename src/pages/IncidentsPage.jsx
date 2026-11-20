import { useCallback, useEffect, useState } from 'react'
import { Activity, ArrowRight, CheckCircle2, Clock3, GitMerge, RefreshCw, ShieldAlert, Siren } from 'lucide-react'
import { api } from '../lib/api'
import { formatDate, safeJson, severityTone, toTitle } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge, Card, CardHeading, DataTable, EmptyState, FieldLabel, Modal, PageHeader, SelectField } from '../components/ui'

const statusOptions = [{value:'open',label:'Open'},{value:'investigating',label:'Investigating'},{value:'contained',label:'Contained'},{value:'closed',label:'Closed'}]

export default function IncidentsPage() {
  const { token, isAdmin } = useAuth()
  const toast = useToast()
  const [incidents, setIncidents] = useState([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [windowMinutes, setWindowMinutes] = useState('30')
  const [correlating, setCorrelating] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    if (!isAdmin) { setBusy(false); return }
    setBusy(true); setError('')
    try { setIncidents(await api.incidents(token, { limit: 200, status: filter === 'all' ? undefined : filter })) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }, [token, filter, isAdmin])
  useEffect(() => { load() }, [load])

  async function runCorrelation(event) {
    event.preventDefault(); setCorrelating(true)
    try { const result = await api.correlate(token, Number(windowMinutes)); toast(`Correlation complete: ${result.incidents_created ?? 0} created, ${result.incidents_updated ?? 0} updated.`); load() }
    catch (err) { toast(err.message, 'error') }
    finally { setCorrelating(false) }
  }

  async function changeStatus(incident, status) {
    try { const updated = await api.updateIncident(token, incident.id, status); setSelected(updated); toast(`Incident #${incident.id} moved to ${status}.`); load() }
    catch (err) { toast(err.message, 'error') }
  }

  if (!isAdmin) return <EmptyState icon={ShieldAlert} title="Administrator access required" description="Incident correlation and status management are restricted to administrators."/>

  const columns = [
    { key: 'id', label: 'Incident', render: (item) => <div><div className="font-mono font-bold text-cyan-200">INC-{String(item.id).padStart(5,'0')}</div><div className="mt-1 text-[10px] text-slate-600">{(item.event_ids || []).length} linked events</div></div> },
    { key: 'title', label: 'Incident summary', render: (item) => <div className="max-w-[360px]"><div className="truncate font-bold text-slate-200">{item.title}</div><div className="mt-1 font-mono text-[10px] text-slate-600">{item.correlation_key?.slice(0,14)}…</div></div> },
    { key: 'severity', label: 'Severity', render: (item) => <Badge tone={severityTone(item.severity)}>{item.severity}</Badge> },
    { key: 'status', label: 'Status', render: (item) => <Badge tone={item.status === 'closed' || item.status === 'contained' ? 'success' : item.status === 'investigating' ? 'warning' : 'info'}>{toTitle(item.status)}</Badge> },
    { key: 'last_seen', label: 'Last seen', render: (item) => <span className="text-xs text-slate-500">{formatDate(item.last_seen)}</span> },
    { key: 'view', label: '', render: (item) => <button className="btn-secondary !px-2.5 !py-1.5 text-[10px]" onClick={() => setSelected(item)}>Review</button> },
  ]

  return <>
    <PageHeader eyebrow="Correlated activity" title="Incident management" description="Group related security events into incidents, review evidence and track investigation status." actions={<button className="btn-secondary" onClick={load}><RefreshCw size={14}/> Refresh</button>}/>
    <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4"><div className="panel p-4"><div className="text-[10px] text-slate-500">Total incidents</div><div className="mt-1 text-2xl font-extrabold text-white">{incidents.length}</div></div><div className="panel p-4"><div className="text-[10px] text-slate-500">Open</div><div className="mt-1 text-2xl font-extrabold text-white">{incidents.filter((i) => i.status === 'open').length}</div></div><div className="panel p-4"><div className="text-[10px] text-slate-500">Investigating</div><div className="mt-1 text-2xl font-extrabold text-white">{incidents.filter((i) => i.status === 'investigating').length}</div></div><div className="panel p-4"><div className="text-[10px] text-slate-500">High / critical</div><div className="mt-1 text-2xl font-extrabold text-white">{incidents.filter((i) => ['high','critical'].includes(i.severity)).length}</div></div></div>
    <Card className="mb-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[.07] p-2.5 text-cyan-200"><GitMerge size={18}/></div><div><h2 className="text-sm font-extrabold text-slate-100">Run event correlation</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">The backend groups recent events that share an observable and source. Correlation is an investigation aid, not proof that events belong to the same attack.</p></div></div><form onSubmit={runCorrelation} className="flex flex-wrap items-end gap-2"><div><FieldLabel>Time window</FieldLabel><select className="field min-w-[170px]" value={windowMinutes} onChange={(e) => setWindowMinutes(e.target.value)}>{[['15','15 minutes'],['30','30 minutes'],['60','1 hour'],['120','2 hours'],['360','6 hours'],['1440','24 hours']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div><button className="btn-primary" disabled={correlating}><GitMerge size={14}/>{correlating ? 'Correlating…' : 'Run correlation'}</button></form></div></Card>
    <Card padding="p-0"><div className="flex flex-col gap-3 p-5 pb-3 sm:flex-row sm:items-center sm:justify-between"><CardHeading title="Incident register" subtitle="Review and update incident status" icon={Siren}/><SelectField className="w-full sm:w-44" value={filter} onChange={setFilter} options={[{value:'all',label:'All statuses'},...statusOptions]}/></div>{error ? <div className="p-5 text-sm text-rose-200">{error}</div> : busy ? <div className="p-5 text-sm text-slate-500">Loading incidents…</div> : <DataTable columns={columns} rows={incidents} emptyTitle="No correlated incidents" emptyDescription="Run correlation after Sentinel AI has received security events."/>}</Card>
    <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Incident INC-${String(selected.id).padStart(5,'0')}` : 'Incident'} description={selected?.title} size="max-w-2xl">
      {selected && <div className="space-y-4"><div className="flex flex-wrap items-center gap-2"><Badge tone={severityTone(selected.severity)}>{selected.severity}</Badge><Badge tone={selected.status === 'closed' || selected.status === 'contained' ? 'success' : 'warning'}>{selected.status}</Badge><span className="text-xs text-slate-500">{(selected.event_ids || []).length} linked event IDs</span></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-line bg-[#0a1422] p-3"><div className="eyebrow">First seen</div><div className="mt-1 text-xs text-slate-300">{formatDate(selected.first_seen)}</div></div><div className="rounded-xl border border-line bg-[#0a1422] p-3"><div className="eyebrow">Last seen</div><div className="mt-1 text-xs text-slate-300">{formatDate(selected.last_seen)}</div></div></div><div><div className="mb-2 text-xs font-bold text-slate-400">Linked event IDs</div><div className="flex flex-wrap gap-2">{(selected.event_ids || []).map((id) => <Badge key={id} tone="info">Event #{id}</Badge>)}</div></div><div><div className="mb-2 text-xs font-bold text-slate-400">Correlation evidence</div><pre className="max-h-64 overflow-auto rounded-xl border border-line bg-[#060e18] p-4 font-mono text-[11px] leading-5 text-cyan-100/80">{safeJson(selected.evidence)}</pre></div><div><FieldLabel>Update incident status</FieldLabel><div className="flex flex-wrap gap-2">{statusOptions.map((option) => <button key={option.value} disabled={selected.status === option.value} onClick={() => changeStatus(selected, option.value)} className={`btn ${selected.status === option.value ? 'border border-emerald-300/20 bg-emerald-300/10 text-emerald-200' : 'btn-secondary'}`}>{option.label}</button>)}</div></div></div>}
    </Modal>
  </>
}
