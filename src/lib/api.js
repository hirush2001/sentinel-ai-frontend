const configuredBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function apiRequest(path, { token, method = 'GET', body, signal, headers = {} } = {}) {
  const url = `${configuredBase}${path.startsWith('/') ? path : `/${path}`}`
  const requestHeaders = { Accept: 'application/json', ...headers }
  if (token) requestHeaders.Authorization = `Bearer ${token}`
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      credentials: 'omit',
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('Cannot reach the Sentinel AI API. Check that the backend is running and the API URL is correct.')
  }

  const raw = await response.text()
  let data = null
  if (raw) {
    try { data = JSON.parse(raw) } catch { data = raw }
  }
  if (!response.ok) {
    const detail = typeof data === 'string' ? data : data?.detail || data?.message || response.statusText
    throw new ApiError(`${response.status}: ${detail}`, response.status, data)
  }
  return data
}

export const api = {
  health: () => apiRequest('/api/v1/health'),
  login: (email, password) => apiRequest('/api/v1/auth/login', { method: 'POST', body: { email, password } }),
  me: (token) => apiRequest('/api/v1/auth/me', { token }),
  dashboard: (token) => apiRequest('/api/v1/dashboard/summary', { token }),
  agents: (token) => apiRequest('/api/v1/agents', { token }),
  createEnrollment: (token, payload) => apiRequest('/api/v1/agents/enrollments', { token, method: 'POST', body: payload }),
  updateAgentStatus: (token, id, status) => apiRequest(`/api/v1/agents/${id}/status`, { token, method: 'PATCH', body: { status } }),
  events: (token, { limit = 100, severity } = {}) => apiRequest(`/api/v1/events?limit=${limit}${severity ? `&severity=${encodeURIComponent(severity)}` : ''}`, { token }),
  systemInfo: (token) => apiRequest('/api/v1/system/info', { token }),
  processes: (token, limit = 100, offset = 0) => apiRequest(`/api/v1/processes?limit=${limit}&offset=${offset}`, { token }),
  processDetections: (token) => apiRequest('/api/v1/processes/detections', { token }),
  ingestProcessDetections: (token) => apiRequest('/api/v1/processes/detections/ingest', { token, method: 'POST' }),
  incidents: (token, { limit = 100, status } = {}) => apiRequest(`/api/v1/incidents?limit=${limit}${status ? `&status=${encodeURIComponent(status)}` : ''}`, { token }),
  correlate: (token, window_minutes = 30) => apiRequest('/api/v1/incidents/correlate', { token, method: 'POST', body: { window_minutes } }),
  updateIncident: (token, id, status) => apiRequest(`/api/v1/incidents/${id}/status`, { token, method: 'PATCH', body: { status } }),
  networkSummary: (token) => apiRequest('/api/v1/network/summary', { token }),
  networkObservations: (token, limit = 100) => apiRequest(`/api/v1/network/observations?limit=${limit}`, { token }),
  assets: (token) => apiRequest('/api/v1/assets', { token }),
  createAsset: (token, payload) => apiRequest('/api/v1/assets', { token, method: 'POST', body: payload }),
  scanAsset: (token, id) => apiRequest(`/api/v1/assets/${id}/scan`, { token, method: 'POST', body: { confirm_authorized: true } }),
  indicators: (token, active_only = false) => apiRequest(`/api/v1/threat-intel/indicators?active_only=${active_only}&limit=500`, { token }),
  createIndicator: (token, payload) => apiRequest('/api/v1/threat-intel/indicators', { token, method: 'POST', body: payload }),
  importIndicators: (token, indicators) => apiRequest('/api/v1/threat-intel/import', { token, method: 'POST', body: { indicators } }),
  updateIndicator: (token, id, is_active) => apiRequest(`/api/v1/threat-intel/indicators/${id}/status`, { token, method: 'PATCH', body: { is_active } }),
  investigations: (token, limit = 100) => apiRequest(`/api/v1/investigations?limit=${limit}`, { token }),
  createInvestigation: (token, event_ids) => apiRequest('/api/v1/investigations', { token, method: 'POST', body: { event_ids, confirm_external_ai: true } }),
  permissions: (token) => apiRequest('/api/v1/permissions', { token }),
  createPermission: (token, payload) => apiRequest('/api/v1/permissions', { token, method: 'POST', body: payload }),
  decidePermission: (token, id, decision, explicit_confirmation = false) => apiRequest(`/api/v1/permissions/${id}/decision`, { token, method: 'POST', body: { decision, explicit_confirmation } }),
  permissionExecution: (token, id) => apiRequest(`/api/v1/permissions/${id}/execution`, { token }),
  recommendations: (token, severity = 'high') => apiRequest(`/api/v1/response/recommendations?severity=${severity}&limit=100`, { token }),
}

export function getApiOrigin() {
  return configuredBase || window.location.origin
}
