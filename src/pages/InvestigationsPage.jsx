import { useCallback, useEffect, useState } from 'react'
import { BrainCircuit, Clock3, Cpu, FileText, RefreshCw, ShieldAlert } from 'lucide-react'
import { api } from '../lib/api'
import { formatDate } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { Badge, Card, CardHeading, DataTable, EmptyState, Modal, PageHeader } from '../components/ui'

export default function InvestigationsPage() {
  const { token } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setItems(await api.investigations(token, 200)) } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [token])
  useEffect(() => { load() }, [load])

  const columns = [
    { key: 'id', label: 'Investigation', render: (item) => <div><div className="font-mono font-bold text-cyan-200">INV-{String(item.id).padStart(5,'0')}</div><div className="mt-1 text-[10px] text-slate-600">{item.event_ids?.length || 0} selected event(s)</div></div> },
    { key: 'summary', label: 'Summary', render: (item) => <div className="max-w-[360px]"><div className="truncate font-bold text-slate-200">{item.summary}</div><div className="mt-1 text-[10px] text-slate-600">{item.model || 'Model not recorded'}</div></div> },
    { key: 'ai_used', label: 'Provider', render: (item) => <Badge tone={item.ai_used ? 'info' : 'muted'}>{item.ai_used ? 'External AI used' : 'No AI used'}</Badge> },
    { key: 'tokens', label: 'Tokens', render: (item) => <span className="font-mono text-xs text-slate-400">{(item.prompt_tokens || 0) + (item.completion_tokens || 0)}</span> },
    { key: 'created_at', label: 'Created', render: (item) => <span className="text-xs text-slate-500">{formatDate(item.created_at)}</span> },
    { key: 'view', label: '', render: (item) => <button className="btn-secondary !px-2.5 !py-1.5 text-[10px]" onClick={() => setSelected(item)}>Open report</button> },
  ]

  return <>
    <PageHeader eyebrow="Assisted analysis" title="AI investigations" description="Review external AI investigation reports initiated by an authenticated user after explicit consent. AI is not used for routine endpoint monitoring." actions={<button className="btn-secondary" onClick={load}><RefreshCw size={14}/> Refresh</button>}/>
    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3"><div className="panel flex items-center gap-3 p-4"><div className="rounded-xl bg-cyan-300/10 p-2.5 text-cyan-200"><BrainCircuit size={18}/></div><div><div className="text-[10px] text-slate-500">Investigation reports</div><div className="text-xl font-extrabold text-white">{items.length}</div></div></div><div className="panel flex items-center gap-3 p-4"><div className="rounded-xl bg-emerald-300/10 p-2.5 text-emerald-200"><Cpu size={18}/></div><div><div className="text-[10px] text-slate-500">External AI reports</div><div className="text-xl font-extrabold text-white">{items.filter((i) => i.ai_used).length}</div></div></div><div className="panel flex items-center gap-3 p-4"><div className="rounded-xl bg-amber-300/10 p-2.5 text-amber-200"><Clock3 size={18}/></div><div><div className="text-[10px] text-slate-500">Total tokens recorded</div><div className="text-xl font-extrabold text-white">{items.reduce((sum, i) => sum + (i.prompt_tokens || 0) + (i.completion_tokens || 0), 0).toLocaleString()}</div></div></div></div>
    <Card padding="p-0"><div className="p-5 pb-3"><CardHeading title="Investigation history" subtitle="Stored investigation summaries and analysis" icon={FileText}/></div>{error ? <div className="p-5 text-sm text-rose-200">{error}</div> : loading ? <div className="p-5 text-sm text-slate-500">Loading reports…</div> : <DataTable columns={columns} rows={items} emptyTitle="No investigations yet" emptyDescription="Select security events from the Event Log and explicitly confirm an external AI investigation."/>}</Card>
    <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[.04] p-4 text-xs leading-5 text-slate-400"><div className="mb-1 flex items-center gap-2 font-bold text-amber-200"><ShieldAlert size={14}/> Privacy and cost</div>External AI requests send selected event details to the configured provider. Backend budgets and cooldowns apply. Do not include secrets, personal documents or unnecessary private information. AI output can be wrong and must be reviewed by a person.</div>
    <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Investigation INV-${String(selected.id).padStart(5,'0')}` : 'Investigation report'} description={selected?.summary} size="max-w-3xl">{selected && <div className="space-y-4"><div className="flex flex-wrap gap-2"><Badge tone={selected.status === 'completed' ? 'success' : 'warning'}>{selected.status}</Badge><Badge tone={selected.ai_used ? 'info' : 'muted'}>{selected.ai_used ? selected.model : 'No external AI'}</Badge><Badge>{selected.event_ids?.length || 0} events</Badge></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Prompt tokens',selected.prompt_tokens],['Completion tokens',selected.completion_tokens],['Total tokens',(selected.prompt_tokens || 0) + (selected.completion_tokens || 0)],['Created',formatDate(selected.created_at)]].map(([label,value]) => <div key={label} className="rounded-xl border border-line bg-[#0a1422] p-3"><div className="eyebrow">{label}</div><div className="mt-1 text-xs font-bold text-slate-200">{value ?? '—'}</div></div>)}</div><div><div className="mb-2 text-xs font-bold text-slate-400">Selected event IDs</div><div className="flex flex-wrap gap-2">{(selected.event_ids || []).map((id) => <Badge key={id} tone="info">#{id}</Badge>)}</div></div><div><div className="mb-2 text-xs font-bold text-slate-400">AI analysis</div><div className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-[#060e18] p-5 text-xs leading-6 text-slate-300">{selected.ai_analysis || 'No analysis text stored.'}</div></div></div>}</Modal>
  </>
}
