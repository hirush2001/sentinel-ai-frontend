import { useCallback, useEffect, useState } from 'react'
import { Copy, Cpu, KeyRound, Plus, RefreshCw, ShieldAlert, ShieldCheck, TerminalSquare } from 'lucide-react'
import { api } from '../lib/api'
import { agentPresence, formatDate, shortId, timeAgo } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge, Card, CardHeading, DataTable, EmptyState, FieldLabel, Modal, PageHeader } from '../components/ui'

export default function AgentsPage() {
  const { token, isAdmin } = useAuth()
  const toast = useToast()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [label, setLabel] = useState('Windows workstation')
  const [expiry, setExpiry] = useState('15')
  const [creating, setCreating] = useState(false)
  const [enrollment, setEnrollment] = useState(null)

  const load = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return }
    setLoading(true); setError('')
    try { setAgents(await api.agents(token)) } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [token, isAdmin])
  useEffect(() => { load() }, [load])

  async function createEnrollment(event) {
    event.preventDefault(); setCreating(true)
    try {
      const result = await api.createEnrollment(token, { label: label.trim(), expires_in_minutes: Number(expiry) })
      setEnrollment(result)
      toast('Enrollment token created. Copy it now; it is shown only once.', 'info')
      load()
    } catch (err) { toast(err.message, 'error') }
    finally { setCreating(false) }
  }

  async function reactivate(agent) {
    try { await api.updateAgentStatus(token, agent.id, 'active'); toast(`${agent.display_name} credential status set to active.`); load() }
    catch (err) { toast(err.message, 'error') }
  }

  function requestAction(agent, action) {
    const name = action === 'pause_agent' ? 'Pause' : 'Revoke'
    const resource = `agent:${agent.id}`
    const reason = action === 'pause_agent'
      ? `Request to pause Sentinel AI agent ${agent.display_name} (${agent.hostname}). This changes the server-side agent credential status only; it does not modify or isolate Windows.`
      : `Request to revoke Sentinel AI agent ${agent.display_name} (${agent.hostname}). This invalidates the Sentinel AI agent credential; the Windows machine is not modified.`
    api.createPermission(token, { action_type: action, resource, reason }).then(() => toast(`${name} request submitted for administrator approval.`)).catch((err) => toast(err.message, 'error'))
  }

  if (!isAdmin) return <EmptyState icon={ShieldCheck} title="Administrator access required" description="Only administrators can list and enrol endpoint agents."/>

  const columns = [
    { key: 'display_name', label: 'Endpoint', render: (agent) => <div><div className="font-bold text-slate-200">{agent.display_name}</div><div className="mt-1 font-mono text-[10px] text-slate-600">{agent.hostname}</div></div> },
    { key: 'platform', label: 'Platform', render: (agent) => <div><div>{agent.os_platform}</div><div className="mt-1 text-[10px] text-slate-600">{agent.os_version}</div></div> },
    { key: 'status', label: 'Status', render: (agent) => <div className="space-y-1"><Badge tone={agent.status === 'active' ? 'success' : agent.status === 'paused' ? 'warning' : 'danger'}>{agent.status}</Badge><div><Badge tone={agentPresence(agent).tone}>{agentPresence(agent).label}</Badge></div></div> },
    { key: 'last_seen', label: 'Last heartbeat', render: (agent) => <div><div className="text-slate-300">{timeAgo(agent.last_seen)}</div><div className="mt-1 text-[10px] text-slate-600">{formatDate(agent.last_seen)}</div></div> },
    { key: 'actions', label: 'Actions', render: (agent) => <div className="flex flex-wrap gap-1.5">{agent.status === 'paused' && <button className="btn-secondary !px-2.5 !py-1.5 text-[10px]" onClick={(e) => { e.stopPropagation(); reactivate(agent) }}>Reactivate</button>}{agent.status === 'active' && <><button className="btn-secondary !px-2.5 !py-1.5 text-[10px]" onClick={(e) => { e.stopPropagation(); requestAction(agent, 'pause_agent') }}>Request pause</button><button className="btn-danger !px-2.5 !py-1.5 text-[10px]" onClick={(e) => { e.stopPropagation(); requestAction(agent, 'revoke_agent') }}>Request revoke</button></>}{agent.status === 'revoked' && <span className="text-[10px] text-slate-600">Re-enrol required</span>}</div> },
  ]

  return <>
    <PageHeader eyebrow="Endpoint management" title="Endpoint agents" description="Enrol Windows endpoints, inspect their identity and heartbeat history, and request controlled agent credential actions." actions={<><button className="btn-secondary" onClick={load}><RefreshCw size={14}/> Refresh</button><button className="btn-primary" onClick={() => { setEnrollment(null); setModalOpen(true) }}><Plus size={15}/> Enrol endpoint</button></>}/>
    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3"><div className="panel flex items-center gap-3 p-4"><div className="rounded-xl bg-cyan-300/10 p-2.5 text-cyan-200"><Cpu size={18}/></div><div><div className="text-[10px] text-slate-500">Registered endpoints</div><div className="text-xl font-extrabold text-white">{agents.length}</div></div></div><div className="panel flex items-center gap-3 p-4"><div className="rounded-xl bg-emerald-300/10 p-2.5 text-emerald-200"><ShieldCheck size={18}/></div><div><div className="text-[10px] text-slate-500">Active credentials</div><div className="text-xl font-extrabold text-white">{agents.filter((a) => a.status === 'active').length}</div></div></div><div className="panel flex items-center gap-3 p-4"><div className="rounded-xl bg-amber-300/10 p-2.5 text-amber-200"><ShieldAlert size={18}/></div><div><div className="text-[10px] text-slate-500">Paused credentials</div><div className="text-xl font-extrabold text-white">{agents.filter((a) => a.status === 'paused').length}</div></div></div></div>
    <Card padding="p-0"><div className="p-5 pb-3"><CardHeading title="Registered endpoints" subtitle="Agent tokens are never displayed here; only a short token prefix is stored by the backend." icon={Cpu}/></div>{error ? <div className="p-5 text-sm text-rose-200">{error}</div> : loading ? <div className="p-5 text-sm text-slate-500">Loading endpoints…</div> : <DataTable columns={columns} rows={agents} emptyTitle="No endpoint agents yet" emptyDescription="Create an enrollment token and run the Windows agent enrollment script to connect your first endpoint."/>}</Card>
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card><CardHeading title="Enrollment workflow" subtitle="Connect a Windows 10/11 endpoint" icon={KeyRound}/><ol className="space-y-3 text-xs leading-5 text-slate-400"><li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-300/10 font-mono text-[10px] text-emerald-200">01</span>Create a short-lived enrollment token from this page.</li><li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-300/10 font-mono text-[10px] text-emerald-200">02</span>Place it in <code className="text-emerald-200">agent/config.json</code> with the backend URL and display name.</li><li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-300/10 font-mono text-[10px] text-emerald-200">03</span>Run <code className="text-emerald-200">agent/enroll_agent.bat</code>, then <code className="text-emerald-200">agent/run_agent.bat</code>.</li><li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-300/10 font-mono text-[10px] text-emerald-200">04</span>Confirm the endpoint heartbeat and event uploads in the fleet view.</li></ol></Card>
      <Card><CardHeading title="Credential safety" subtitle="Important behaviour from the backend" icon={ShieldCheck}/><ul className="space-y-2 text-xs leading-5 text-slate-400"><li>• Enrollment tokens expire and can be used once.</li><li>• The long-term agent token is protected locally with Windows DPAPI.</li><li>• The backend stores a token hash, not the raw token.</li><li>• Pause and revoke actions require a permission request, administrator approval and explicit confirmation.</li><li>• Revocation does not modify or isolate the Windows computer; the endpoint must be re-enrolled to regain a valid credential.</li></ul></Card>
    </div>
    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={enrollment ? 'Enrollment token created' : 'Enrol a new endpoint'} description={enrollment ? 'This one-time token is shown only in this dialog. Copy it before closing.' : 'Create a short-lived token for a Windows endpoint.'}>
      {enrollment ? <div className="space-y-4"><div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] p-4"><div className="eyebrow text-emerald-200">One-time enrollment token</div><div className="mt-3 break-all font-mono text-sm leading-6 text-white">{enrollment.enrollment_token}</div><button className="btn-primary mt-3 w-full" onClick={async () => { try { await navigator.clipboard.writeText(enrollment.enrollment_token); toast('Enrollment token copied.') } catch { toast('Clipboard access is unavailable. Select and copy the token manually.', 'info') } }}><Copy size={14}/> Copy token</button></div><div className="rounded-xl border border-line bg-[#0a1422] p-3 text-xs text-slate-400">Expires: <b className="text-slate-200">{formatDate(enrollment.expires_at)}</b><p className="mt-2">The endpoint agent stores the returned long-term token with Windows DPAPI. Do not share either token publicly.</p></div><button className="btn-secondary w-full" onClick={() => { setModalOpen(false); setEnrollment(null); load() }}>Done</button></div> : <form className="space-y-4" onSubmit={createEnrollment}><div><FieldLabel required>Endpoint label</FieldLabel><input className="field" required minLength={2} maxLength={150} value={label} onChange={(e) => setLabel(e.target.value)}/></div><div><FieldLabel>Token validity</FieldLabel><select className="field" value={expiry} onChange={(e) => setExpiry(e.target.value)}><option value="5">5 minutes</option><option value="15">15 minutes (recommended)</option><option value="30">30 minutes</option><option value="60">60 minutes</option></select></div><div className="rounded-xl border border-amber-300/15 bg-amber-300/[.05] p-3 text-xs leading-5 text-amber-100/80">The enrollment token is displayed once. Keep it private and use it immediately on the endpoint you own or are authorised to monitor.</div><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" disabled={creating}><KeyRound size={14}/>{creating ? 'Creating…' : 'Create token'}</button></div></form>}
    </Modal>
  </>
}
