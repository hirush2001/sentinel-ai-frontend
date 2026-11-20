import { useCallback, useEffect, useState } from 'react'
import { Globe2, Plus, Radar, RefreshCw, Router, ScanLine, ShieldCheck, Wifi } from 'lucide-react'
import { api } from '../lib/api'
import { formatDate, severityTone, safeJson } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge, Card, CardHeading, DataTable, EmptyState, FieldLabel, Modal, PageHeader, StatCard } from '../components/ui'

export default function NetworkPage() {
  const { token, isAdmin } = useAuth()
  const toast = useToast()
  const [summary, setSummary] = useState(null)
  const [observations, setObservations] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assetOpen, setAssetOpen] = useState(false)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [assetType, setAssetType] = useState('host')
  const [authorized, setAuthorized] = useState(false)
  const [authorizationNote, setAuthorizationNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [scanAsset, setScanAsset] = useState(null)
  const [scanConfirm, setScanConfirm] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return }
    setLoading(true); setError('')
    try { const [s,o,a] = await Promise.all([api.networkSummary(token), api.networkObservations(token, 200), api.assets(token)]); setSummary(s); setObservations(o); setAssets(a) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [token, isAdmin])
  useEffect(() => { load() }, [load])

  async function registerAsset(event) {
    event.preventDefault(); setSaving(true)
    try { await api.createAsset(token, { name: name.trim(), target: target.trim(), asset_type: assetType, authorized, authorization_note: authorizationNote.trim() }); toast('Asset registered.'); setAssetOpen(false); setName(''); setTarget(''); setAuthorizationNote(''); setAuthorized(false); load() }
    catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function runScan() {
    if (!scanAsset || !scanConfirm) return
    setScanning(true)
    try { const result = await api.scanAsset(token, scanAsset.id); setScanResult(result); toast(`Authorised scan completed for ${scanAsset.name}.`); load() }
    catch (err) { toast(err.message, 'error') }
    finally { setScanning(false) }
  }

  const networkColumns = [
    { key: 'severity', label: 'Severity', render: (item) => <Badge tone={severityTone(item.severity)}>{item.severity}</Badge> },
    { key: 'message', label: 'Observation', render: (item) => <div className="max-w-[330px]"><div className="font-bold text-slate-200">{item.message}</div><div className="mt-1 font-mono text-[10px] text-slate-600">Event #{item.event_id}</div></div> },
    { key: 'remote', label: 'Remote endpoint', render: (item) => <div className="font-mono text-[11px] text-slate-400">{item.details?.remote_ip || item.details?.destination_ip || '—'}{item.details?.remote_port ? `:${item.details.remote_port}` : ''}</div> },
    { key: 'source', label: 'Source', render: (item) => <span className="font-mono text-[10px] text-slate-500">{item.source}</span> },
    { key: 'last_seen', label: 'Last seen', render: (item) => <span className="text-xs text-slate-500">{formatDate(item.last_seen)}</span> },
    { key: 'details', label: '', render: (item) => <button className="btn-secondary !px-2.5 !py-1.5 text-[10px]" onClick={() => setDetail(item)}>Details</button> },
  ]
  const assetColumns = [
    { key: 'name', label: 'Asset', render: (item) => <div><div className="font-bold text-slate-200">{item.name}</div><div className="mt-1 font-mono text-[10px] text-slate-600">{item.target}</div></div> },
    { key: 'asset_type', label: 'Type', render: (item) => <Badge>{item.asset_type}</Badge> },
    { key: 'authorized', label: 'Authorization', render: (item) => <Badge tone={item.authorized ? 'success' : 'warning'}>{item.authorized ? 'Authorised' : 'Not authorised'}</Badge> },
    { key: 'created_at', label: 'Registered', render: (item) => <span className="text-xs text-slate-500">{formatDate(item.created_at)}</span> },
    { key: 'scan', label: '', render: (item) => <button disabled={!item.authorized} className="btn-secondary !px-2.5 !py-1.5 text-[10px]" onClick={() => { setScanAsset(item); setScanConfirm(false); setScanResult(null) }}><ScanLine size={12}/> Scan</button> },
  ]

  if (!isAdmin) return <EmptyState icon={ShieldCheck} title="Administrator access required" description="Network observations and Nmap scan controls are restricted to administrators."/>

  return <>
    <PageHeader eyebrow="Network intelligence" title="Network security" description="Review endpoint connection observations and manage explicitly authorised assets for manual Nmap scans." actions={<><button className="btn-secondary" onClick={load}><RefreshCw size={14}/> Refresh</button><button className="btn-primary" onClick={() => setAssetOpen(true)}><Plus size={15}/> Register asset</button></>}/>
    <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4"><StatCard label="Network observations" value={summary?.network_events_total ?? 0} icon={ActivityIcon} tone="cyan"/><StatCard label="High / critical" value={summary?.network_events_high ?? 0} icon={Radar} tone="rose"/><StatCard label="Registered assets" value={assets.length} icon={Router} tone="mint"/><StatCard label="Authorised assets" value={assets.filter((a) => a.authorized).length} icon={ShieldCheck} tone="amber"/></div>
    <div className="mb-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[.045] p-4"><div className="flex items-start gap-3"><div className="rounded-lg bg-emerald-300/10 p-2 text-emerald-200"><ShieldCheck size={16}/></div><div><div className="text-xs font-extrabold text-emerald-100">Safe scanning policy</div><p className="mt-1 text-xs leading-5 text-slate-400">The endpoint agent does not perform port scans. Nmap scans are only started manually for an asset marked as authorised, after a separate confirmation in this interface. Register only systems you own or have written permission to test.</p></div></div></div>
    {error && <div className="mb-4 text-sm text-rose-200">{error}</div>}
    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1.2fr_.8fr]">
      <Card padding="p-0"><div className="p-5 pb-3"><CardHeading title="Network observations" subtitle="Selected connection metadata received by the backend" icon={Globe2}/></div>{loading ? <div className="p-5 text-xs text-slate-500">Loading observations…</div> : <DataTable columns={networkColumns} rows={observations} emptyTitle="No network observations" emptyDescription="Selected endpoint connection events will appear here when received."/>}</Card>
      <Card padding="p-0"><div className="p-5 pb-3"><CardHeading title="Registered assets" subtitle="Targets available for authorised manual scans" icon={Router}/></div>{loading ? <div className="p-5 text-xs text-slate-500">Loading assets…</div> : <DataTable columns={assetColumns} rows={assets} emptyTitle="No assets registered" emptyDescription="Register a single host or IP address. Network ranges and URLs are not accepted."/>}</Card>
    </div>
    <Modal open={assetOpen} onClose={() => setAssetOpen(false)} title="Register an asset" description="Add a host or IP address that you are authorised to monitor or scan.">
      <form className="space-y-4" onSubmit={registerAsset}><div><FieldLabel required>Asset name</FieldLabel><input className="field" required minLength={2} maxLength={150} value={name} onChange={(e) => setName(e.target.value)} placeholder="Office workstation"/></div><div><FieldLabel required>IP address or hostname</FieldLabel><input className="field" required value={target} onChange={(e) => setTarget(e.target.value)} placeholder="192.0.2.10 or workstation.example"/><p className="mt-1 text-[10px] text-slate-600">Enter one IP address or hostname only. Do not enter a URL or network range.</p></div><div><FieldLabel>Asset type</FieldLabel><select className="field" value={assetType} onChange={(e) => setAssetType(e.target.value)}><option value="host">Host</option><option value="server">Server</option><option value="workstation">Workstation</option><option value="network_device">Network device</option></select></div><div><FieldLabel required>Authorisation note</FieldLabel><textarea className="field min-h-24 resize-y" required minLength={10} maxLength={1000} value={authorizationNote} onChange={(e) => setAuthorizationNote(e.target.value)} placeholder="Describe why you are authorised to monitor or scan this asset."/></div><label className="flex items-start gap-3 rounded-xl border border-line p-3"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald-300" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)}/><span className="text-xs leading-5 text-slate-300">I confirm that I own this asset or have permission from its owner to scan it. Only mark this if that statement is true.</span></label><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setAssetOpen(false)}>Cancel</button><button className="btn-primary" disabled={saving}><Plus size={14}/>{saving ? 'Saving…' : 'Register asset'}</button></div></form>
    </Modal>
    <Modal open={!!scanAsset} onClose={() => { setScanAsset(null); setScanResult(null) }} title={scanResult ? 'Scan completed' : 'Confirm authorised scan'} description={scanAsset ? `${scanAsset.name} · ${scanAsset.target}` : ''}>
      {scanResult ? <div className="space-y-4"><div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] p-4"><div className="flex items-center gap-2 text-sm font-bold text-emerald-200"><ShieldCheck size={17}/> Nmap scan completed</div><div className="mt-2 text-xs text-slate-400">Duration: {scanResult.duration_seconds}s · Open ports: {scanResult.open_ports?.length || 0}</div></div><div className="flex flex-wrap gap-2">{(scanResult.open_ports || []).map((port,index) => <Badge key={index} tone="info">{typeof port === 'object' ? JSON.stringify(port) : port}</Badge>)}{!scanResult.open_ports?.length && <span className="text-xs text-slate-500">No open ports returned.</span>}</div><button className="btn-secondary w-full" onClick={() => setScanAsset(null)}>Close</button></div> : <div className="space-y-4"><div className="rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-4 text-xs leading-5 text-amber-100/80">This starts a TCP connect scan of the registered host using Nmap. Confirm that you have permission to scan this exact system. The backend will refuse the scan if the asset is not marked authorised.</div><label className="flex items-start gap-3 rounded-xl border border-line p-3"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald-300" checked={scanConfirm} onChange={(e) => setScanConfirm(e.target.checked)}/><span className="text-xs leading-5 text-slate-300">I explicitly confirm that I am authorised to scan <b className="text-white">{scanAsset?.target}</b>.</span></label><div className="flex justify-end gap-2"><button className="btn-secondary" onClick={() => setScanAsset(null)}>Cancel</button><button className="btn-primary" disabled={!scanConfirm || scanning} onClick={runScan}><ScanLine size={14}/>{scanning ? 'Scanning…' : 'Start Nmap scan'}</button></div></div>}
    </Modal>
    <Modal open={!!detail} onClose={() => setDetail(null)} title={`Network event #${detail?.event_id ?? ''}`} description={detail?.message}><div className="space-y-3"><Badge tone={severityTone(detail?.severity)}>{detail?.severity}</Badge><pre className="max-h-80 overflow-auto rounded-xl border border-line bg-[#060e18] p-4 font-mono text-[11px] leading-5 text-cyan-100/80">{safeJson(detail?.details)}</pre></div></Modal>
  </>
}
function ActivityIcon() { return <Wifi size={18}/> }
