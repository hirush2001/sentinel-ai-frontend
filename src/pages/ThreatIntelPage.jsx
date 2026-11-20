import { useCallback, useEffect, useMemo, useState } from 'react'
import { Database, FileUp, Plus, RefreshCw, ShieldAlert, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react'
import { api } from '../lib/api'
import { formatDate, severityTone, toTitle } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge, Card, CardHeading, DataTable, EmptyState, FieldLabel, Modal, PageHeader, SearchInput, SelectField, Toggle } from '../components/ui'

export default function ThreatIntelPage() {
  const { token, isAdmin } = useAuth()
  const toast = useToast()
  const [indicators, setIndicators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [type, setType] = useState('ip')
  const [value, setValue] = useState('')
  const [source, setSource] = useState('manual')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('high')
  const [saving, setSaving] = useState(false)
  const [importText, setImportText] = useState('')

  const load = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return }
    setLoading(true); setError('')
    try { setIndicators(await api.indicators(token, false)) } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [token, isAdmin])
  useEffect(() => { load() }, [load])
  const visible = useMemo(() => indicators.filter((item) => (activeFilter === 'all' || (activeFilter === 'active' ? item.is_active : !item.is_active)) && `${item.value} ${item.indicator_type} ${item.source} ${item.description}`.toLowerCase().includes(search.toLowerCase())), [indicators, activeFilter, search])

  async function create(event) {
    event.preventDefault(); setSaving(true)
    try { await api.createIndicator(token, { indicator_type: type, value: value.trim(), source: source.trim() || 'manual', description: description.trim(), severity }); toast('Threat indicator added.'); setCreateOpen(false); setValue(''); setDescription(''); load() }
    catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function importBulk(event) {
    event.preventDefault(); setSaving(true)
    try { const parsed = JSON.parse(importText); if (!Array.isArray(parsed) || !parsed.length) throw new Error('Paste a JSON array containing at least one indicator.'); const result = await api.importIndicators(token, parsed); toast(`Import finished: ${result.created} created, ${result.skipped} skipped.`); setImportOpen(false); load() }
    catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function toggle(item) {
    try { await api.updateIndicator(token, item.id, !item.is_active); toast(`Indicator ${item.is_active ? 'disabled' : 'enabled'}.`); load() }
    catch (err) { toast(err.message, 'error') }
  }

  if (!isAdmin) return <EmptyState icon={ShieldCheck} title="Administrator access required" description="Threat indicator management is restricted to administrators."/>

  const columns = [
    { key: 'indicator_type', label: 'Type', render: (item) => <Badge tone="info">{item.indicator_type.toUpperCase()}</Badge> },
    { key: 'value', label: 'Indicator', render: (item) => <div className="max-w-[330px]"><div className="break-all font-mono text-xs font-bold text-slate-200">{item.value}</div><div className="mt-1 text-[10px] text-slate-600">{item.source}</div></div> },
    { key: 'severity', label: 'Severity', render: (item) => <Badge tone={severityTone(item.severity)}>{item.severity}</Badge> },
    { key: 'description', label: 'Description', render: (item) => <span className="block max-w-[280px] truncate text-xs text-slate-500">{item.description || '—'}</span> },
    { key: 'is_active', label: 'Active', render: (item) => <div className="flex items-center gap-2"><Toggle checked={item.is_active} onChange={() => toggle(item)}/><span className="text-[10px] text-slate-500">{item.is_active ? 'Enabled' : 'Disabled'}</span></div> },
    { key: 'created_at', label: 'Added', render: (item) => <span className="text-xs text-slate-500">{formatDate(item.created_at)}</span> },
  ]

  return <>
    <PageHeader eyebrow="Curated indicators" title="Threat intelligence" description="Manage IP addresses, domains, SHA-256 hashes and URLs. Indicators are administrator-curated; this backend does not automatically download third-party feeds." actions={<><button className="btn-secondary" onClick={() => setImportOpen(true)}><FileUp size={14}/> Import JSON</button><button className="btn-primary" onClick={() => setCreateOpen(true)}><Plus size={15}/> Add indicator</button></>}/>
    <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4"><div className="panel p-4"><div className="text-[10px] text-slate-500">Total indicators</div><div className="mt-1 text-2xl font-extrabold text-white">{indicators.length}</div></div><div className="panel p-4"><div className="text-[10px] text-slate-500">Active</div><div className="mt-1 text-2xl font-extrabold text-white">{indicators.filter((i) => i.is_active).length}</div></div><div className="panel p-4"><div className="text-[10px] text-slate-500">IP / domain</div><div className="mt-1 text-2xl font-extrabold text-white">{indicators.filter((i) => ['ip','domain'].includes(i.indicator_type)).length}</div></div><div className="panel p-4"><div className="text-[10px] text-slate-500">Hash / URL</div><div className="mt-1 text-2xl font-extrabold text-white">{indicators.filter((i) => ['sha256','url'].includes(i.indicator_type)).length}</div></div></div>
    <Card padding="p-0"><div className="flex flex-col gap-3 p-5 pb-3 lg:flex-row lg:items-center lg:justify-between"><CardHeading title="Indicator library" subtitle="Active and disabled records from the backend" icon={Database}/><div className="flex flex-col gap-2 sm:flex-row"><SearchInput className="sm:w-64" value={search} onChange={setSearch} placeholder="Search indicator or source…"/><SelectField className="sm:w-36" value={activeFilter} onChange={setActiveFilter} options={[{value:'all',label:'All records'},{value:'active',label:'Active only'},{value:'disabled',label:'Disabled only'}]}/><button className="btn-secondary" onClick={load}><RefreshCw size={14}/></button></div></div>{error ? <div className="p-5 text-sm text-rose-200">{error}</div> : loading ? <div className="p-5 text-sm text-slate-500">Loading indicators…</div> : <DataTable columns={columns} rows={visible} emptyTitle="No indicators found" emptyDescription="Add a known suspicious observable or import a curated JSON list."/>}</Card>
    <div className="mt-4 rounded-xl border border-line/70 bg-[#0c1726] p-4 text-xs leading-5 text-slate-500"><div className="mb-1 flex items-center gap-2 font-bold text-slate-300"><ShieldAlert size={14} className="text-amber-300"/> Matching behaviour</div>Incoming agent events are checked against enabled indicators. A match is added to the event evidence and may raise its severity. An indicator match should still be reviewed before taking action.</div>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add threat indicator" description="Add a curated observable for event matching."><form className="space-y-4" onSubmit={create}><div><FieldLabel required>Indicator type</FieldLabel><select className="field" value={type} onChange={(e) => setType(e.target.value)}><option value="ip">IP address</option><option value="domain">Domain</option><option value="sha256">SHA-256 hash</option><option value="url">URL</option></select></div><div><FieldLabel required>Indicator value</FieldLabel><input className="field" required minLength={3} maxLength={512} value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'ip' ? '203.0.113.10' : type === 'sha256' ? '64-character SHA-256 hash' : type === 'domain' ? 'suspicious.example' : 'https://example.test/path'}/></div><div><FieldLabel>Source</FieldLabel><input className="field" maxLength={150} value={source} onChange={(e) => setSource(e.target.value)} placeholder="manual-review"/></div><div><FieldLabel>Description</FieldLabel><textarea className="field min-h-20 resize-y" maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Why this indicator is being tracked…"/></div><div><FieldLabel>Severity</FieldLabel><select className="field" value={severity} onChange={(e) => setSeverity(e.target.value)}>{['info','low','medium','high','critical'].map((v) => <option key={v} value={v}>{toTitle(v)}</option>)}</select></div><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button><button className="btn-primary" disabled={saving}><Plus size={14}/>{saving ? 'Saving…' : 'Add indicator'}</button></div></form></Modal>
    <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import indicators" description="Paste a JSON array using the backend indicator schema."><form className="space-y-4" onSubmit={importBulk}><div><FieldLabel required>JSON indicator list</FieldLabel><textarea className="field min-h-[220px] resize-y font-mono text-[11px] leading-5" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={'[{ "indicator_type": "ip", "value": "203.0.113.10", "source": "manual-review", "description": "Example only", "severity": "high" }]'}/></div><p className="text-[10px] leading-5 text-slate-600">Maximum 500 records per request. Each record needs indicator_type and value. Optional fields: source, description, severity, expires_at.</p><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setImportOpen(false)}>Cancel</button><button className="btn-primary" disabled={saving}><FileUp size={14}/>{saving ? 'Importing…' : 'Import indicators'}</button></div></form></Modal>
  </>
}
