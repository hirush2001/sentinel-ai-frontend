export function formatDate(value, options = {}) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', ...options,
  }).format(date)
}

export function timeAgo(value) {
  if (!value) return 'Never connected'
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (!Number.isFinite(seconds)) return 'Unknown'
  if (seconds < 10) return 'Just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function agentPresence(agent) {
  if (agent.status === 'paused') return { label: 'Paused', tone: 'muted', live: false }
  if (agent.status === 'revoked') return { label: 'Revoked', tone: 'danger', live: false }
  if (!agent.last_seen) return { label: 'Awaiting heartbeat', tone: 'muted', live: false }
  const age = Date.now() - new Date(agent.last_seen).getTime()
  if (age <= 3 * 60 * 1000) return { label: 'Recently seen', tone: 'success', live: true }
  if (age <= 15 * 60 * 1000) return { label: 'Delayed heartbeat', tone: 'warning', live: false }
  return { label: 'Stale heartbeat', tone: 'danger', live: false }
}

export function severityTone(severity = 'info') {
  return ({ critical: 'danger', high: 'danger', medium: 'warning', low: 'success', info: 'muted' })[severity.toLowerCase()] || 'muted'
}

export function shortId(value, size = 8) {
  if (!value) return '—'
  const text = String(value)
  return text.length > size ? `${text.slice(0, size)}…` : text
}

export function toTitle(value = '') {
  return String(value).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function safeJson(value) {
  try { return JSON.stringify(value ?? {}, null, 2) } catch { return String(value) }
}
