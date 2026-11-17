async function request(path, options = {}) {
  const response = await fetch(path, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers }, ...options })
  if (response.status === 204) return null
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Permintaan tidak dapat diproses.')
  return body
}
export const api = {
  me: () => request('/api/auth/me'),
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  reports: () => request('/api/reports'),
  myReports: () => request('/api/reports/my'),
  updateReportStatus: (id, status) => request(`/api/reports/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}
