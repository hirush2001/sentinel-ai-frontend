import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardCheck, GitBranch, Hand, Plus, RefreshCw, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react'
import { api } from '../lib/api'
import { formatDate, severityTone, toTitle } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge, Card, CardHeading, DataTable, EmptyState, FieldLabel, Modal, PageHeader } from '../components/ui'

const ACTIONS = ['read_file','modify_file','delete_file','block_ip','isolate_device','change_firewall','disable_account','install_software','stop_service','pause_agent','revoke_agent','other']
const CONFIRMATION_ACTIONS = new Set(['delete_file','block_ip','isolate_device','change_firewall','disable_account','install_software','stop_service','pause_agent','revoke_agent'])
const EXECUTABLE_ACTIONS = new Set(['pause_agent','revoke_agent'])

export default function ResponsePage() {
  const { token, isAdmin } = useAuth()
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [actionType, setActionType] = useState('other')
  const [resource, setResource] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [decisionItem, setDecisionItem] = useState(null)
  const [decision, setDecision] = useState('approved')
  const [explicit, setExplicit] = useState(false)
  const [decisionBusy, setDecisionBusy] = useState(false)
  const [execution, setExecution] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { const [p,r] = await Promise.all([api.permissions(token), isAdmin ? api.recommendations(token, 'high') : Promise.resolve({ recommendations: [] })]); setRequests(p); setRecommendations(r.recommendations || []) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [token, isAdmin])
  useEffect(() => { load() }, [load])

  async function createRequest(event) {
    event.preventDefault(); setSaving(true)
    try { await api.createPermission(token, { action_type: actionType, resource: resource.trim(), reason: reason.trim() }); toast('Permission request submitted.'); setCreateOpen(false); setResource(''); setReason(''); load() }
    catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  function openDecision(item, value) { setDecisionItem(item); setDecision(value); setExplicit(false); setExecution(null) }
  async function submitDecision() {
    if (!decisionItem) return
    const requires = decision === 'approved' && CONFIRMATION_ACTIONS.has(decisionItem.action_type)
    if (requires && !explicit) return
    setDecisionBusy(true)
    try {
      const updated = await api.decidePermission(token, decisionItem.id, decision, explicit)
      if (decision === 'approved') {
        try { setExecution(await api.permissionExecution(token, decisionItem.id)) } catch { setExecution(null) }
      }
      toast(`Request #${decisionItem.id} ${decision}.`)
      setDecisionItem(updated)
      load()
    } catch (err) { toast(err.message, 'error') }
    finally { setDecisionBusy(false) }
  }

  const columns = [
    { key: 'id', label: 'Request', render: (item) => <span className="font-mono font-bold text-cyan-200">REQ-{String(item.id).padStart(5,'0')}</span> },
    { key: 'action_type', label: 'Action', render: (item) => <div><div className="font-bold text-slate-200">{toTitle(item.action_type)}</div><div className="mt-1 max-w-[230px] truncate font-mono text-[10px] text-slate-600">{item.resource}</div></div> },
    { key: 'reason', label: 'Reason', render: (item) => <span className="block max-w-[260px] truncate text-xs text-slate-500">{item.reason}</span> },
    { key: 'status', label: 'Status', render: (item) => <Badge tone={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}>{item.status}</Badge> },
    { key: 'created_at', label: 'Requested', render: (item) => <span className="text-xs text-slate-500">{formatDate(item.created_at)}</span> },
    { key: 'actions', label: '', render: (item) => item.status === 'pending' && isAdmin ? <div className="flex gap-1.5"><button className="btn-primary !px-2.5 !py-1.5 text-[10px]" onClick={() => openDecision(item,'approved')}>Review</button><button className="btn-danger !px-2.5 !py-1.5 text-[10px]" onClick={() => openDecision(item,'rejected')}>Reject</button></div> : <button className="btn-secondary !px-2.5 !py-1.5 text-[10px]" onClick={async () => { setDecisionItem(item); setDecision(item.status); try { setExecution(await api.permissionExecution(token,item.id)) } catch { setExecution(null) } }}>Details</button> },
  ]

  const pending = useMemo(() => requests.filter((r) => r.status === 'pending').length, [requests])

  return <>
    <PageHeader eyebrow="Human-in-the-loop security" title="Response & approvals" description="Review response recommendations and manage permission requests. Sentinel AI only executes approved agent pause/revoke actions; other actions remain manual." actions={<><button className="btn-secondary" onClick={load}><RefreshCw size={14}/> Refresh</button><button className="btn-primary" onClick={() => setCreateOpen(true)}><Plus size={15}/> New request</button></>}/>
    <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4"><div className="panel p-4"><div className="text-[10px] text-slate-500">All requests</div><div className="mt-1 text-2xl font-extrabold text-white">{requests.length}</div></div><div className="panel p-4"><div className="text-[10px] text-slate-500">Pending approval</div><div className="mt-1 text-2xl font-extrabold text-amber-200">{pending}</div></div><div className="panel p-4"><div className="text-[10px] text-slate-500">Approved</div><div className="mt-1 text-2xl font-extrabold text-emerald-200">{requests.filter((r) => r.status === 'approved').length}</div></div><div className="panel p-4"><div className="text-[10px] text-slate-500">Rejected</div><div className="mt-1 text-2xl font-extrabold text-rose-200">{requests.filter((r) => r.status === 'rejected').length}</div></div></div>
    {error && <div className="mb-4 text-sm text-rose-200">{error}</div>}
    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1.3fr_.7fr]">
      <Card padding="p-0"><div className="p-5 pb-3"><CardHeading title="Permission queue" subtitle="Administrator decisions and execution records" icon={ClipboardCheck}/></div>{loading ? <div className="p-5 text-xs text-slate-500">Loading requests…</div> : <DataTable columns={columns} rows={requests} emptyTitle="No permission requests" emptyDescription="Requests submitted from the endpoint or response workflow will appear here."/>}</Card>
      <Card><CardHeading title="Response recommendations" subtitle="Backend-generated review steps for high and critical events" icon={ShieldAlert}/>{recommendations.length ? <div className="space-y-3">{recommendations.slice(0,8).map((item) => <div key={item.event_id} className="rounded-xl border border-line/70 bg-[#0a1422] p-3"><div className="flex items-center justify-between gap-2"><span className="font-mono text-[10px] text-slate-600">EVENT #{item.event_id}</span><Badge tone={severityTone(item.severity)}>{item.severity}</Badge></div><div className="mt-2 text-xs font-bold text-slate-200">{item.message}</div><ul className="mt-2 space-y-1.5">{item.recommended_steps.map((step,index) => <li key={index} className="flex gap-2 text-[10px] leading-5 text-slate-500"><span className="text-emerald-300">•</span>{step}</li>)}</ul></div>)}</div> : <EmptyState icon={ShieldCheck} title="No recommendations" description="High and critical event recommendations will appear here."/>}</Card>
    </div>
    <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[.04] p-4"><div className="flex items-start gap-3"><AlertTriangle size={16} className="mt-0.5 text-amber-300"/><div className="text-xs leading-5 text-slate-400"><b className="text-amber-200">Execution boundary:</b> Only <code className="text-slate-200">pause_agent</code> and <code className="text-slate-200">revoke_agent</code> have backend executors. These actions change the Sentinel AI credential status only. They do not terminate processes, delete files, change Windows Firewall, disable Windows accounts or isolate a device. All other actions remain <code>manual_required</code>.</div></div></div>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create permission request" description="Describe the action and the resource that needs review."><form className="space-y-4" onSubmit={createRequest}><div><FieldLabel required>Action type</FieldLabel><select className="field" value={actionType} onChange={(e) => setActionType(e.target.value)}>{ACTIONS.map((action) => <option key={action} value={action}>{toTitle(action)}</option>)}</select></div><div><FieldLabel required>Resource</FieldLabel><input className="field" required minLength={2} maxLength={1000} value={resource} onChange={(e) => setResource(e.target.value)} placeholder={actionType.includes('agent') ? 'agent:2' : 'Host, file path, IP address or resource identifier'}/>{actionType.includes('agent') && <p className="mt-1 text-[10px] text-slate-600">For agent actions, use the exact format agent: followed by the numeric agent ID.</p>}</div><div><FieldLabel required>Reason</FieldLabel><textarea className="field min-h-24 resize-y" required minLength={5} maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why this action is needed and what evidence supports it."/></div><div className="rounded-xl border border-line bg-[#0a1422] p-3 text-xs leading-5 text-slate-500">Creating a request does not execute the action. It enters the approval queue for an administrator decision.</div><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button><button className="btn-primary" disabled={saving}><Plus size={14}/>{saving ? 'Submitting…' : 'Submit request'}</button></div></form></Modal>
    <Modal open={!!decisionItem} onClose={() => setDecisionItem(null)} title={decisionItem ? `Review request #${decisionItem.id}` : 'Review request'} description={decisionItem ? `${toTitle(decisionItem.action_type)} · ${decisionItem.resource}` : ''}>
      {decisionItem && <div className="space-y-4"><div className="rounded-xl border border-line bg-[#0a1422] p-4"><div className="eyebrow">Reason provided</div><p className="mt-2 text-xs leading-5 text-slate-300">{decisionItem.reason}</p></div><div className="flex flex-wrap gap-2"><Badge tone={decisionItem.status === 'pending' ? 'warning' : decisionItem.status === 'approved' ? 'success' : 'danger'}>{decisionItem.status}</Badge><Badge>{toTitle(decisionItem.action_type)}</Badge></div>{decisionItem.status === 'pending' ? <><div className="rounded-xl border border-amber-300/20 bg-amber-300/[.05] p-3 text-xs leading-5 text-amber-100/80">{EXECUTABLE_ACTIONS.has(decisionItem.action_type) ? 'This action changes the Sentinel AI agent credential status only. It does not change the Windows computer.' : 'This action has no automatic executor in the current release. If approved, it will be recorded as manual_required and must be completed manually outside Sentinel AI.'}</div>{decision === 'approved' && CONFIRMATION_ACTIONS.has(decisionItem.action_type) && <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald-300" checked={explicit} onChange={(e) => setExplicit(e.target.checked)}/><span className="text-xs leading-5 text-slate-300">I explicitly confirm this approval after reviewing the target and reason.</span></label>}<div className="flex flex-wrap justify-end gap-2"><button className="btn-secondary" onClick={() => setDecisionItem(null)}>Cancel</button><button className="btn-danger" disabled={decisionBusy} onClick={() => { setDecision('rejected'); setExplicit(false); api.decidePermission(token, decisionItem.id, 'rejected', false).then((updated) => { setDecisionItem(updated); toast('Request rejected.'); load() }).catch((err) => toast(err.message,'error')) }}>Reject</button><button className="btn-primary" disabled={decisionBusy || (decision === 'approved' && CONFIRMATION_ACTIONS.has(decisionItem.action_type) && !explicit)} onClick={submitDecision}><CheckCircle2 size={14}/>{decisionBusy ? 'Saving…' : 'Approve request'}</button></div></> : <div className="rounded-xl border border-line bg-[#0a1422] p-3 text-xs text-slate-400">Decision recorded on {formatDate(decisionItem.decided_at)}. {execution && <div className="mt-2"><b className="text-slate-200">Execution status:</b> {execution.status}<pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] text-slate-500">{JSON.stringify(execution.result || {}, null, 2)}</pre></div>}</div>}</div>}
    </Modal>
  </>
}
