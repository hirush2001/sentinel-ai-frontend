import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Fingerprint, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function LoginPage() {
  const { token, signIn } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (token) return <Navigate to="/" replace/>

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email.trim(), password)
      toast('Signed in to Sentinel AI.')
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally { setBusy(false) }
  }

  return <div className="relative flex min-h-screen overflow-hidden bg-[#070d17]">
    <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-60"/>
    <div className="pointer-events-none absolute -left-32 top-1/3 h-[520px] w-[520px] rounded-full bg-emerald-400/[.06] blur-[100px]"/>
    <div className="pointer-events-none absolute -right-24 -top-24 h-[500px] w-[500px] rounded-full bg-cyan-400/[.06] blur-[100px]"/>
    <div className="relative mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-[1.05fr_.95fr]">
      <section className="hidden flex-col justify-between px-14 py-12 lg:flex">
        <div className="flex items-center gap-3"><div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-2.5 text-emerald-200"><ShieldCheck size={22}/></div><div><div className="text-sm font-extrabold tracking-[.18em] text-white">SENTINEL <span className="text-emerald-300">AI</span></div><div className="text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">Security operations platform</div></div></div>
        <div className="max-w-xl"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 pulse-dot"/> Defensive monitoring environment</div><h1 className="text-5xl font-extrabold leading-[1.13] tracking-[-.045em] text-white">Clarity across<br/><span className="text-emerald-300">every endpoint.</span></h1><p className="mt-6 max-w-md text-sm leading-7 text-slate-400">A unified view of endpoint health, security events, threat intelligence and human-approved response workflows.</p>
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">{[{value:'01',label:'Monitor'},{value:'02',label:'Investigate'},{value:'03',label:'Respond' }].map((item) => <div key={item.value} className="rounded-xl border border-line/70 bg-[#0d1827]/80 p-4"><div className="font-mono text-xs text-emerald-300">{item.value}</div><div className="mt-2 text-xs font-bold text-slate-300">{item.label}</div></div>)}</div>
        </div>
        <div className="text-[10px] text-slate-700">Sentinel AI · Defensive cybersecurity monitoring prototype</div>
      </section>
      <section className="relative flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[430px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-2 text-emerald-200"><ShieldCheck size={20}/></div><div className="text-sm font-extrabold tracking-[.16em] text-white">SENTINEL <span className="text-emerald-300">AI</span></div></div>
          <div className="panel p-7 shadow-2xl sm:p-9">
            <div className="mb-7"><div className="mb-4 inline-flex rounded-xl border border-cyan-300/15 bg-cyan-300/[.07] p-3 text-cyan-200"><Fingerprint size={22}/></div><div className="eyebrow">Secure workspace</div><h2 className="mt-2 text-2xl font-extrabold text-white">Welcome back</h2><p className="mt-2 text-sm text-slate-500">Sign in with your Sentinel AI account.</p></div>
            <form onSubmit={submit} className="space-y-5">
              <div><label className="mb-2 block text-xs font-bold text-slate-400">Email address</label><input className="field" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com"/></div>
              <div><label className="mb-2 block text-xs font-bold text-slate-400">Password</label><div className="relative"><input className="field pr-12" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white" onClick={() => setShowPassword((v) => !v)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></div>
              {error && <div className="rounded-xl border border-rose-400/20 bg-rose-400/[.07] px-3 py-2.5 text-xs leading-5 text-rose-200">{error}</div>}
              <button className="btn-primary w-full !py-3" disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'}<ArrowRight size={16}/></button>
            </form>
            <div className="mt-7 border-t border-line/70 pt-5 text-center text-[10px] leading-5 text-slate-600">Your access token stays in page memory and is cleared when you sign out or refresh the page.</div>
          </div>
          <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-slate-600"><ShieldCheck size={13} className="text-emerald-400"/> Protected administrator workspace</div>
        </div>
      </section>
    </div>
  </div>
}
