import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const dismiss = useCallback((id) => setItems((current) => current.filter((item) => item.id !== id)), [])
  const toast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`
    setItems((current) => [...current, { id, message, type }])
    window.setTimeout(() => dismiss(id), 4500)
  }, [dismiss])
  const value = useMemo(() => ({ toast }), [toast])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-5 top-5 z-[100] flex w-[min(390px,calc(100vw-40px))] flex-col gap-2">
        {items.map((item) => {
          const Icon = item.type === 'error' ? XCircle : item.type === 'info' ? Info : CheckCircle2
          return <div key={item.id} className="toast-enter flex items-start gap-3 rounded-xl border border-white/10 bg-[#101b2b] px-4 py-3 shadow-2xl">
            <Icon size={18} className={item.type === 'error' ? 'text-rose-400' : item.type === 'info' ? 'text-cyan-300' : 'text-emerald-300'} />
            <p className="min-w-0 flex-1 text-sm text-slate-200">{item.message}</p>
            <button onClick={() => dismiss(item.id)} className="text-slate-500 hover:text-white"><X size={15}/></button>
          </div>
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider')
  return value.toast
}
