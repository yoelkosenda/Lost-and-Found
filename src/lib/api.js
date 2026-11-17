import { supabase } from './supabase.js'

const SESSION_KEY = 'lf_session_token'

function getToken() {
  try {
    return localStorage.getItem(SESSION_KEY) || ''
  } catch {
    return ''
  }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem(SESSION_KEY, token)
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // Ignore storage errors in restricted environments
  }
}

async function rpc(fnName, params = {}) {
  try {
    const { data, error } = await supabase.rpc(fnName, params)
    if (error) {
      const msg = error.message || ''
      if (/failed to fetch/i.test(msg)) {
        throw new Error('Gagal terhubung ke server Supabase. Periksa koneksi internet Anda atau muat ulang halaman.')
      }
      throw new Error(msg || 'Permintaan tidak dapat diproses.')
    }
    return data
  } catch (err) {
    if (/failed to fetch/i.test(err?.message || '')) {
      throw new Error('Gagal terhubung ke server Supabase. Periksa koneksi internet Anda atau muat ulang halaman.')
    }
    throw err
  }
}

export const api = {
  async me() {
    const token = getToken()
    if (!token) throw new Error('Sesi Anda telah berakhir. Silakan masuk kembali.')
    try {
      return await rpc('api_me', { p_token: token })
    } catch (err) {
      setToken('')
      throw err
    }
  },
  async login(email, password) {
    const data = await rpc('api_login', { p_email: email, p_password: password })
    setToken(data.token)
    return { user: data.user }
  },
  async logout() {
    const token = getToken()
    setToken('')
    if (token) {
      await rpc('api_logout', { p_token: token }).catch(() => null)
    }
    return null
  },
  reports: () => rpc('api_reports', { p_token: getToken() }),
  myReports: () => rpc('api_my_reports', { p_token: getToken() }),
  updateReportStatus: (id, status) =>
    rpc('api_update_report_status', {
      p_token: getToken(),
      p_report_id: Number(id),
      p_status: status,
    }),
  createReport: (data) =>
    rpc('api_create_report', {
      p_token: getToken(),
      p_type: data.type,
      p_title: data.title,
      p_category: data.category,
      p_location: data.location,
      p_description: data.description,
      p_reported_at: data.reported_at || null,
      p_image_url: data.image_url || null,
      p_latitude: data.latitude ?? null,
      p_longitude: data.longitude ?? null,
    }),
  report: (id) =>
    rpc('api_report_detail', {
      p_token: getToken(),
      p_report_id: Number(id),
    }),
  publicReports: () => rpc('api_public_reports'),
  activities: () => rpc('api_activities', { p_token: getToken() }),
  createClaim: (report_id, message) =>
    rpc('api_create_claim', {
      p_token: getToken(),
      p_report_id: Number(report_id),
      p_message: message,
    }),
  myClaims: () => rpc('api_my_claims', { p_token: getToken() }),
  reportClaims: (reportId) =>
    rpc('api_report_claims', { p_token: getToken(), p_report_id: Number(reportId) }),
  claimDetail: (claimId) =>
    rpc('api_claim_detail', { p_token: getToken(), p_claim_id: Number(claimId) }),
  claimMessages: (claimId) =>
    rpc('api_claim_messages', { p_token: getToken(), p_claim_id: Number(claimId) }),
  sendClaimMessage: (claimId, message) =>
    rpc('api_send_claim_message', {
      p_token: getToken(), p_claim_id: Number(claimId), p_message: message,
    }),
  decideClaim: (claimId, decision) =>
    rpc('api_decide_claim', {
      p_token: getToken(), p_claim_id: Number(claimId), p_decision: decision,
    }),
  togglePhoneShare: (claimId, agree) =>
    rpc('api_toggle_phone_share', {
      p_token: getToken(), p_claim_id: Number(claimId), p_agree: agree,
    }),
}
