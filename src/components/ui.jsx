import { useState } from 'react'
import { AlertCircle, Check, ChevronDown, ChevronRight, Loader2, Search, X } from 'lucide-react'
import clsx from 'clsx'

export function PageHeader({ eyebrow, title, description, actions, children }) {
  return <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
    <div className="min-w-0">
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">{title}</h1>
      {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>}
      {children}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
}

export function Card({ children, className = '', padding = 'p-5' }) {
  return <section className={clsx('panel min-w-0', padding, className)}>{children}</section>
}

export function CardHeading({ title, subtitle, action, icon: Icon }) {
  return <div className="mb-4 flex items-start justify-between gap-3">
    <div className="flex min-w-0 items-start gap-3">
      {Icon && <div className="mt-0.5 rounded-lg border border-line bg-[#132238] p-2 text-emerald-200"><Icon size={16}/></div>}
      <div className="min-w-0"><h2 className="text-sm font-extrabold text-slate-100">{title}</h2>{subtitle && <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>}</div>
    </div>
    {action}
  </div>
}

export function StatCard({ label, value, detail, icon: Icon, tone = 'mint', loading = false }) {
  const tones = {
    mint: 'text-emerald-300 bg-emerald-300/10 border-emerald-300/10',
    cyan: 'text-cyan-300 bg-cyan-300/10 border-cyan-300/10',
    amber: 'text-amber-300 bg-amber-300/10 border-amber-300/10',
    rose: 'text-rose-300 bg-rose-300/10 border-rose-300/10',
    slate: 'text-slate-300 bg-slate-300/10 border-slate-300/10',
  }
  return <div className="panel p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-xs font-semibold text-slate-500">{label}</p><div className="mt-2 text-[26px] font-extrabold tracking-tight text-white tabular-nums">{loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-white/10"/> : (value ?? '—')}</div>{detail && <p className="mt-1 text-[11px] text-slate-500">{detail}</p>}</div>
      {Icon && <div className={clsx('rounded-xl border p-2.5', tones[tone] || tones.mint)}><Icon size={18}/></div>}
    </div>
  </div>
}

export function Badge({ children, tone = 'muted', dot = false, className = '' }) {
  const tones = {
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    warning: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
    danger: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
    info: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
    muted: 'border-slate-500/20 bg-slate-500/10 text-slate-400',
  }
  const dotTone = { success: 'bg-emerald-300', warning: 'bg-amber-300', danger: 'bg-rose-300', info: 'bg-cyan-300', muted: 'bg-slate-400' }
  return <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-wide', tones[tone] || tones.muted, className)}>{dot && <span className={clsx('h-1.5 w-1.5 rounded-full', dotTone[tone] || dotTone.muted)}/>}{children}</span>
}

export function EmptyState({ icon: Icon = AlertCircle, title, description, action }) {
  return <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div className="mb-4 rounded-2xl border border-line bg-[#132238] p-4 text-slate-400"><Icon size={24}/></div>
    <h3 className="text-sm font-bold text-slate-200">{title}</h3>
    {description && <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
}

export function LoadingState({ label = 'Loading data…' }) {
  return <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><Loader2 size={17} className="animate-spin text-emerald-300"/>{label}</div>
}

export function ErrorState({ message, onRetry }) {
  return <div className="flex flex-col items-center justify-center gap-3 py-10 text-center"><AlertCircle size={22} className="text-rose-300"/><p className="max-w-xl text-sm text-rose-200">{message}</p>{onRetry && <button className="btn-secondary" onClick={onRetry}>Try again</button>}</div>
}

export function Modal({ open, onClose, title, description, children, size = 'max-w-xl' }) {
  if (!open) return null
  return <div className="modal-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.() }}>
    <div className={clsx('max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-line bg-[#0d1828] shadow-2xl', size)}>
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-[#0d1828]/95 px-5 py-4 backdrop-blur">
        <div><h2 className="text-base font-extrabold text-white">{title}</h2>{description && <p className="mt-1 text-xs text-slate-500">{description}</p>}</div>
        <button className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white" onClick={onClose}><X size={18}/></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return <div className={clsx('relative', className)}><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input className="field pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}/></div>
}

export function SelectField({ value, onChange, options, className = '' }) {
  return <div className={clsx('relative', className)}><select className="select-field" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"/></div>
}

export function FieldLabel({ children, required = false }) {
  return <label className="mb-1.5 block text-xs font-bold text-slate-400">{children}{required && <span className="ml-1 text-rose-300">*</span>}</label>
}

export function DataTable({ columns, rows, emptyTitle = 'Nothing to show', emptyDescription = 'There are no records available yet.', onRowClick }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[650px] border-collapse"><thead><tr>{columns.map((column) => <th key={column.key} className={clsx('table-head px-4 py-3', column.className)}>{column.label}</th>)}</tr></thead><tbody>
    {rows.length ? rows.map((row, index) => <tr key={row.id ?? index} onClick={() => onRowClick?.(row)} className={clsx('transition hover:bg-white/[.025]', onRowClick && 'cursor-pointer')}>{columns.map((column) => <td key={column.key} className={clsx('table-cell', column.cellClassName)}>{column.render ? column.render(row) : (row[column.key] ?? '—')}</td>)}</tr>) : <tr><td colSpan={columns.length}><EmptyState title={emptyTitle} description={emptyDescription}/></td></tr>}
  </tbody></table></div>
}

export function Toggle({ checked, onChange, disabled = false }) {
  return <button type="button" disabled={disabled} onClick={() => onChange(!checked)} className={clsx('relative h-6 w-11 rounded-full border transition', checked ? 'border-emerald-300/40 bg-emerald-300/25' : 'border-line bg-[#172438]')}><span className={clsx('absolute top-[3px] h-4 w-4 rounded-full transition', checked ? 'left-[22px] bg-emerald-300' : 'left-[3px] bg-slate-500')}/></button>
}

export function CopyButton({ value, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1400) } catch { setCopied(false) }
  }
  return <button className="btn-secondary !px-3 !py-2" onClick={copy}>{copied ? <Check size={14} className="text-emerald-300"/> : <ChevronRight size={14}/>}{copied ? 'Copied' : label}</button>
}
