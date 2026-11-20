import { useCallback, useEffect, useState } from 'react'
import { Activity, Cpu, HardDrive, MemoryStick, RefreshCw, ScanSearch, ShieldAlert, TerminalSquare } from 'lucide-react'
import { api } from '../lib/api'
import { formatDate, severityTone } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge, Card, CardHeading, DataTable, EmptyState, ErrorState, PageHeader, StatCard } from '../components/ui'

export default function ProcessesPage() {
  const { token, isAdmin } = useAuth()
  const toast = useToast()
  const [system, setSystem] = useState(null)
  const [inventory, setInventory] = useState(null)
  const [detections, setDetections] = useState(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [ingesting, setIngesting] = useState(false)

  const load = useCallback(async () => {
    if (!isAdmin) { setBusy(false); return }
    setBusy(true); setError('')
    try { const [s,p,d] = await Promise.all([api.systemInfo(token), api.processes(token, 100, 0), api.processDetections(token)]); setSystem(s); setInventory(p); setDetections(d) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }, [token, isAdmin])
  useEffect(() => { load() }, [load])

  async function ingest() {
    setIngesting(true)
    try { const result = await api.ingestProcessDetections(token); toast(`Process scan saved. ${result.persistence?.events_created ?? 0} new event(s), ${result.persistence?.duplicates_updated ?? 0} duplicate update(s).`); load() }
    catch (err) { toast(err.message, 'error') }
    finally { setIngesting(false) }
  }

  if (!isAdmin) return <EmptyState icon={ShieldAlert} title="Administrator access required" description="System and process monitoring endpoints are restricted to administrators."/>
  if (busy && !system) return <div className="py-8"><PageHeader eyebrow="Host diagnostics" title="Process monitor"/><div className="panel"><div className="p-6 text-sm text-slate-500">Collecting local host inventory…</div></div></div>
  if (error && !system) return <ErrorState message={error} onRetry={load}/>

  const computer = system?.computer || {}
  const memory = system?.memory || {}
  const cpu = system?.cpu || {}
  const processColumns = [
    { key: 'pid', label: 'PID', render: (p) => <span className="font-mono text-xs text-cyan-200">{p.pid}</span> },
    { key: 'name', label: 'Process', render: (p) => <div><div className="font-bold text-slate-200">{p.name}</div><div className="mt-1 text-[10px] text-slate-600">Parent: {p.parent_name || 'Unknown'} · PID {p.parent_pid ?? '—'}</div></div> },
    { key: 'status', label: 'State', render: (p) => <Badge tone={p.status === 'running' ? 'success' : 'muted'}>{p.status || 'unknown'}</Badge> },
    { key: 'executable_path', label: 'Executable path', render: (p) => <span className="block max-w-[430px] truncate font-mono text-[10px] text-slate-500" title={p.executable_path}>{p.executable_path || 'Path unavailable'}</span> },
  ]
  const findings = detections?.findings || []

  return <>
    <PageHeader eyebrow="Host diagnostics" title="Process monitor" description="Read-only process inventory and deterministic behaviour checks from the backend host. This page inspects the computer running the API, not remote endpoint processes." actions={<><button className="btn-secondary" onClick={load}><RefreshCw size={14}/> Refresh</button><button className="btn-primary" disabled={ingesting} onClick={ingest}><ScanSearch size={14}/>{ingesting ? 'Saving findings…' : 'Run & save detections'}</button></>}/>
    {error && <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/[.07] p-3 text-xs text-rose-200">{error}</div>}
    <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4"><StatCard label="Processes collected" value={inventory?.process_count ?? 0} icon={Cpu} tone="cyan"/><StatCard label="Deterministic findings" value={detections?.finding_count ?? 0} icon={ShieldAlert} tone={findings.length ? 'amber' : 'mint'}/><StatCard label="CPU usage" value={`${cpu.usage_percent ?? 0}%`} icon={Activity} tone="mint"/><StatCard label="Memory used" value={`${memory.used_percent ?? 0}%`} detail={`${memory.available_gb ?? '—'} GB available`} icon={MemoryStick} tone="amber"/></div>
    <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <Card><CardHeading title="Backend host" subtitle="System information collected by psutil" icon={HardDrive}/><div className="grid grid-cols-2 gap-3">{[['Hostname',computer.hostname],['Operating system',`${computer.operating_system || ''} ${computer.os_release || ''}`],['Architecture',computer.architecture],['Processor',computer.processor],['Physical cores',cpu.physical_cores],['Logical cores',cpu.logical_cores],['Total memory',`${memory.total_gb ?? '—'} GB`],['Uptime',`${Math.floor((system?.system?.uptime_seconds || 0)/3600)} hours`]].map(([label,value]) => <div key={label} className="rounded-xl border border-line/70 bg-[#0a1422] p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</div><div className="mt-1 break-words text-xs font-semibold text-slate-300">{value ?? '—'}</div></div>)}</div></Card>
      <Card><CardHeading title="Detection engine" subtitle="Local deterministic process rules · no AI API calls" icon={ScanSearch}/><div className="space-y-3">{[
        ['SAI-PROC-001','Office application launched a script host','medium'],['SAI-PROC-002','Nested script execution detected','medium'],['SAI-PROC-003','Protected Windows process in unexpected location','high'],['SAI-PROC-004','Execution utility in a user-writable directory','medium'],
      ].map(([id,title,severity]) => <div key={id} className="flex items-start gap-3 rounded-xl border border-line/70 bg-[#0a1422] p-3"><div className="mt-0.5 rounded-lg bg-cyan-300/10 p-1.5 text-cyan-200"><TerminalSquare size={14}/></div><div className="min-w-0 flex-1"><div className="font-mono text-[10px] text-slate-500">{id}</div><div className="mt-1 text-xs font-bold text-slate-300">{title}</div></div><Badge tone={severityTone(severity)}>{severity}</Badge></div>)}</div><p className="mt-3 text-[10px] leading-5 text-slate-600">A finding is a reason to review activity, not proof of malware. This collector does not terminate or modify processes.</p></Card>
    </div>
    <Card padding="p-0"><div className="p-5 pb-3"><CardHeading title="Process findings" subtitle={`${findings.length} finding(s) in the latest deterministic analysis`} icon={ShieldAlert}/></div>{findings.length ? <div className="divide-y divide-line/60">{findings.map((finding,index) => <div key={`${finding.rule_id}-${index}`} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start"><div className="flex min-w-0 flex-1 gap-3"><div className="rounded-lg border border-amber-300/15 bg-amber-300/[.06] p-2 text-amber-200"><ShieldAlert size={16}/></div><div><div className="font-bold text-slate-200">{finding.title}</div><div className="mt-1 text-xs leading-5 text-slate-500">{finding.description}</div><div className="mt-2 font-mono text-[10px] text-slate-600">{finding.rule_id} · PID {finding.evidence?.pid} · {finding.evidence?.process_name}</div><div className="mt-2 text-[11px] text-emerald-200/70">Recommended: {finding.recommended_action}</div></div></div><Badge tone={severityTone(finding.severity)}>{finding.severity}</Badge></div>)}</div> : <EmptyState icon={ShieldCheckIcon} title="No process findings" description="No configured process rule matched the current inventory."/>}</Card>
    <div className="mt-4"><Card padding="p-0"><div className="p-5 pb-3"><CardHeading title="Process inventory" subtitle={`Showing ${inventory?.returned_count ?? 0} of ${inventory?.total_processes ?? 0} processes · collected ${formatDate(inventory?.collected_at)}`} icon={Cpu}/></div><DataTable columns={processColumns} rows={inventory?.processes || []} emptyTitle="No process records" emptyDescription="The process collector did not return any records."/></Card></div>
  </>
}

function ShieldCheckIcon() { return <ShieldAlert size={22}/> }
