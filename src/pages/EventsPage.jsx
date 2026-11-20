import { useCallback, useEffect, useMemo, useState } from 'react'
import { BrainCircuit, CheckSquare, ChevronRight, Clock3, FileJson, Filter, Search, ShieldAlert, X } from 'lucide-react'
import { api } from '../lib/api'
import { formatDate, safeJson, severityTone, toTitle } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge, Card, CardHeading, EmptyState, FieldLabel, Modal, PageHeader, SearchInput, SelectField } from '../components/ui'

export default function EventsPage() {
  const { token } = useAuth()
  const toast = useToast()
  const [events, setEvents] = useState([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [severity, setSeverity] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [investigateOpen, setInvestigateOpen] = useState(false)
  const [consent, setConsent] = useState(false)
  const [investigating, setInvestigating] = useState(false)

  const load = useCallback(async () => {
    setBusy(true); setError('')
    try { const rows = await api.events(token, { limit: 200, severity: severity === 'all' ? undefined : severity }); setEvents(rows); setSelectedIds((ids) => ids.filter((id) => rows.some((row) => row.id === id))) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }, [token, severity])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => events.filter((event) => `${event.message} ${event.source} ${event.event_type} ${event.id}`.toLowerCase().includes(query.toLowerCase())), [events, query])
  const toggle = (id) => setSelectedIds((current) => current.includes(id) ? current.filter((x) => x !== id) : current.length < 20 ? [...current, id] : current)

  async function runInvestigation() {
    if (!consent || !selectedIds.length) return
    setInvestigating(true)
    try { const result = await api.createInvestigation(token, selectedIds); toast(`Investigation ${result.id} completed.`, 'success'); setInvestigateOpen(false); setConsent(false); setSelectedIds([]) }
    catch (err) { toast(err.message, 'error') }
    finally { setInvestigating(false) }
  }

  return <>
    <PageHeader eyebrow="Detection stream" title="Security events" description="Review event groups received from agents and backend detection services. Select up to 20 events for an optional external AI investigation." actions={<button className="btn-secondary" onClick={load}><Clock3 size={14}/> Refresh events</button>}/>
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="panel p-4"><div className="text-[10px] text-slate-500">Loaded events</div><div className="mt-1 text-2xl font-extrabold text-white">{events.length}</div></div>{['critical','high','medium'].map((level) => <div key={level} className="panel p-4"><div className="text-[10px] capitalize text-slate-500">{level} severity</div><div className="mt-1 text-2xl font-extrabold text-white">{events.filter((e) => e.severity === level).length}</div></div>)}</div>
    <Card padding="p-0">
      <div className="flex flex-col gap-3 border-b border-line/70 p-5 lg:flex-row lg:items-center lg:justify-between"><div><CardHeading title="Event log" subtitle="Sorted by most recently seen" icon={ShieldAlert}/></div><div className="flex flex-col gap-2 sm:flex-row"><SearchInput className="sm:w-64" value={query} onChange={setQuery} placeholder="Search events, source, type…"/><SelectField className="sm:w-40" value={severity} onChange={setSeverity} options={[{value:'all',label:'All severities'},...['critical','high','medium','low','info'].map((v)=>({value:v,label:toTitle(v)}))]}/></div></div>
      {error && <div className="p-5 text-sm text-rose-200">{error}</div>}
      <div className="overflow-x-auto"><table className="w-full min-w-[850px]"><thead><tr><th className="table-head w-10 px-4 py-3"><span className="sr-only">Select</span></th><th className="table-head px-3 py-3">Severity</th><th className="table-head px-3 py-3">Event</th><th className="table-head px-3 py-3">Source</th><th className="table-head px-3 py-3">Occurrences</th><th className="table-head px-4 py-3">Last seen</th><th className="table-head px-3 py-3"></th></tr></thead><tbody>{filtered.map((event) => <tr key={event.id} className="group hover:bg-white/[.025]"><td className="table-cell px-4"><input aria-label={`Select event ${event.id}`} type="checkbox" className="h-4 w-4 accent-emerald-300" checked={selectedIds.includes(event.id)} onChange={() => toggle(event.id)} disabled={!selectedIds.includes(event.id) && selectedIds.length >= 20}/></td><td className="table-cell px-3"><Badge tone={severityTone(event.severity)}>{event.severity}</Badge></td><td className="table-cell max-w-[360px] px-3"><button onClick={() => setSelectedEvent(event)} className="text-left"><div className="truncate font-bold text-slate-200 group-hover:text-emerald-200">{event.message}</div><div className="mt-1 font-mono text-[10px] text-slate-600">#{event.id} · {event.event_type}</div></button></td><td className="table-cell max-w-[190px] truncate px-3 font-mono text-[11px] text-slate-500">{event.source}</td><td className="table-cell px-3 tabular-nums">{event.occurrences}</td><td className="table-cell px-4 text-xs text-slate-500">{formatDate(event.last_seen)}</td><td className="table-cell px-3"><button className="rounded-lg p-1.5 text-slate-600 hover:bg-white/5 hover:text-white" onClick={() => setSelectedEvent(event)}><ChevronRight size={16}/></button></td></tr>)}</tbody></table>{!busy && !filtered.length && <EmptyState icon={Filter} title="No matching events" description="Change the severity filter or search phrase."/>}{busy && <div className="p-5 text-center text-xs text-slate-500">Refreshing event stream…</div>}</div>
      {selectedIds.length > 0 && <div className="sticky bottom-3 mx-4 mb-4 flex flex-col gap-3 rounded-xl border border-emerald-300/20 bg-[#10251f]/95 p-3 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-xs text-emerald-100"><CheckSquare size={15}/><b>{selectedIds.length} event{selectedIds.length > 1 ? 's' : ''} selected</b><span className="text-emerald-200/50">· Maximum 20 per investigation</span></div><div className="flex gap-2"><button className="btn-ghost !py-2 text-xs" onClick={() => setSelectedIds([])}>Clear</button><button className="btn-primary !py-2 text-xs" onClick={() => setInvestigateOpen(true)}><BrainCircuit size={14}/> Investigate with external AI</button></div></div>}
    </Card>
    <Modal open={!!selectedEvent} onClose={() => setSelectedEvent(null)} title={`Event #${selectedEvent?.id ?? ''}`} description={selectedEvent?.event_type} size="max-w-2xl">
      {selectedEvent && <div className="space-y-4"><div className="flex flex-wrap items-center gap-2"><Badge tone={severityTone(selectedEvent.severity)}>{selectedEvent.severity}</Badge><Badge>{selectedEvent.status}</Badge><span className="text-xs text-slate-500">{selectedEvent.occurrences} occurrence(s)</span></div><div className="rounded-xl border border-line bg-[#091321] p-4"><div className="text-sm font-bold text-slate-100">{selectedEvent.message}</div><div className="mt-2 font-mono text-[11px] text-slate-500">Source: {selectedEvent.source}</div></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="rounded-xl border border-line bg-[#0a1422] p-3"><div className="eyebrow">First seen</div><div className="mt-1 text-xs text-slate-300">{formatDate(selectedEvent.created_at)}</div></div><div className="rounded-xl border border-line bg-[#0a1422] p-3"><div className="eyebrow">Last seen</div><div className="mt-1 text-xs text-slate-300">{formatDate(selectedEvent.last_seen)}</div></div></div><div><div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-400"><FileJson size={14}/> Event details</div><pre className="max-h-[340px] overflow-auto rounded-xl border border-line bg-[#060e18] p-4 font-mono text-[11px] leading-5 text-emerald-100/80">{safeJson(selectedEvent.details)}</pre></div></div>}
    </Modal>
    <Modal open={investigateOpen} onClose={() => { setInvestigateOpen(false); setConsent(false) }} title="External AI investigation" description="This action sends the selected event data to the configured external AI provider.">
      <div className="space-y-4"><div className="rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-4 text-xs leading-5 text-amber-100/80"><div className="font-extrabold text-amber-200">Before you continue</div><p className="mt-2">Sentinel AI does not use AI for routine monitoring. This request sends up to 20 selected event records and their details to the external provider configured on your backend. Redaction is applied by the backend but may not identify every sensitive value.</p></div><div className="rounded-xl border border-line bg-[#0a1422] p-3 text-xs text-slate-400">Selected event IDs: <span className="font-mono text-slate-200">{selectedIds.join(', ')}</span></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald-300" checked={consent} onChange={(e) => setConsent(e.target.checked)}/><span className="text-xs leading-5 text-slate-300">I understand that these selected security event details will be sent to the external AI provider, and I explicitly consent to this investigation.</span></label><div className="flex justify-end gap-2"><button className="btn-secondary" onClick={() => setInvestigateOpen(false)}>Cancel</button><button className="btn-primary" disabled={!consent || investigating} onClick={runInvestigation}><BrainCircuit size={14}/>{investigating ? 'Investigating…' : 'Confirm and investigate'}</button></div></div>
    </Modal>
  </>
}
