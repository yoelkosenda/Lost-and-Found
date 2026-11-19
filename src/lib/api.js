import { supabase } from './supabase.js'

const SESSION_KEY = 'lf_session_token'
const GEMINI_KEY_STORAGE = 'lf_gemini_api_key'
const GEMINI_MODEL_STORAGE = 'lf_gemini_model'
const GEMINI_LAST_WORKING_MODEL = 'lf_gemini_working_model'
const DEFAULT_FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.0-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]

const discoveredModelsCache = new Map()
const aiMatchesCache = new Map()
const reverseGeocodeCache = new Map()

function fetchWithTimeout(url, options = {}, timeoutMs = 7500) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer))
}

function normalizeGeminiModel(model) {
  const cleaned = String(model || '')
    .trim()
    .replace(/^models\//i, '')
  if (!cleaned || cleaned.toLowerCase() === 'auto') return ''
  return cleaned
}

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

function getGeminiKey() {
  try {
    const stored = (localStorage.getItem(GEMINI_KEY_STORAGE) || '').trim()
    if (stored) return stored
  } catch {
    // Ignore storage errors
  }
  return (import.meta.env.VITE_GEMINI_API_KEY || '').trim()
}

function setGeminiKey(key) {
  try {
    const trimmed = String(key || '').trim()
    if (trimmed) localStorage.setItem(GEMINI_KEY_STORAGE, trimmed)
    else localStorage.removeItem(GEMINI_KEY_STORAGE)
  } catch {
    // Ignore storage errors
  }
}

function getGeminiKeySource() {
  try {
    if ((localStorage.getItem(GEMINI_KEY_STORAGE) || '').trim()) return 'custom'
  } catch {
    // Ignore
  }
  if ((import.meta.env.VITE_GEMINI_API_KEY || '').trim()) return 'env'
  return ''
}

function getGeminiModel() {
  try {
    const stored = normalizeGeminiModel(localStorage.getItem(GEMINI_MODEL_STORAGE))
    if (stored) return stored
  } catch {
    // Ignore storage errors
  }
  return normalizeGeminiModel(import.meta.env.VITE_GEMINI_MODEL)
}

function setGeminiModel(model) {
  try {
    const normalized = normalizeGeminiModel(model)
    if (normalized) localStorage.setItem(GEMINI_MODEL_STORAGE, normalized)
    else localStorage.removeItem(GEMINI_MODEL_STORAGE)
  } catch {
    // Ignore storage errors
  }
}

function scoreModelForAutoOrder(modelId) {
  const id = modelId.toLowerCase()
  // Exclude specialized non-text endpoints from auto-selection (still usable if manually chosen)
  if (
    /(tts|image|imagen|veo|embedding|aqa|robotics|computer-use|audio|whisper|learnlm|thinking)/i.test(
      id,
    )
  ) {
    return -1000
  }
  let score = 0
  if (id.startsWith('gemini-')) score += 500
  else if (id.startsWith('gemma-')) score += 200

  // Prioritaskan varian Flash di mode otomatis karena jauh lebih cepat (1-2 detik) dan kuota gratisnya besar
  if (id.includes('flash') && !id.includes('lite')) score += 180
  else if (id.includes('flash-lite')) score += 160
  else if (id.includes('pro')) score -= 80

  const versionMatch = id.match(/gemini-(\d+(?:\.\d+)?)/)
  if (versionMatch) {
    score += parseFloat(versionMatch[1]) * 40
  } else if (id.includes('latest')) {
    score += 110
  }

  // Penalti untuk model experimental/preview atau snapshot tanggal di mode otomatis agar tidak lambat/429
  if (id.includes('exp') || id.includes('preview')) score -= 90
  if (/-\d{2}-\d{2}|-\d{3,4}$/.test(id)) score -= 35
  return score
}

async function listGeminiModels(customApiKey, { forceRefresh = false } = {}) {
  const apiKey = (customApiKey || getGeminiKey() || '').trim()
  if (!apiKey) return []

  const cached = discoveredModelsCache.get(apiKey)
  if (!forceRefresh && cached && Date.now() - cached.timestamp < 300000) {
    return cached.models
  }

  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models?pageSize=100&key=${encodeURIComponent(apiKey)}`,
    {},
    5000,
  )
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    const msg = errData?.error?.message || `HTTP ${response.status}`
    throw new Error(msg)
  }

  const data = await response.json()
  const rawModels = Array.isArray(data?.models) ? data.models : []
  const models = rawModels
    .filter(
      (m) =>
        m?.name &&
        (!Array.isArray(m.supportedGenerationMethods) ||
          m.supportedGenerationMethods.includes('generateContent')),
    )
    .map((m) => {
      const id = normalizeGeminiModel(m.name)
      return {
        id,
        displayName: m.displayName || id,
        description: m.description || '',
        autoScore: scoreModelForAutoOrder(id),
      }
    })
    .filter((m) => Boolean(m.id))
    .sort((a, b) => b.autoScore - a.autoScore || a.id.localeCompare(b.id))

  discoveredModelsCache.set(apiKey, { timestamp: Date.now(), models })
  return models
}

function parseEvaluationsJson(rawText) {
  const text = String(rawText || '').trim()
  if (!text) return []
  try {
    const direct = JSON.parse(text)
    if (Array.isArray(direct?.evaluations)) return direct.evaluations
    if (Array.isArray(direct)) return direct
  } catch {
    // Try stripping markdown fences or extracting JSON object
  }
  const fenced = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    const parsed = JSON.parse(fenced)
    if (Array.isArray(parsed?.evaluations)) return parsed.evaluations
    if (Array.isArray(parsed)) return parsed
  } catch {
    // Try finding first {...} block
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) {
    const parsed = JSON.parse(text.slice(start, end + 1))
    if (Array.isArray(parsed?.evaluations)) return parsed.evaluations
  }
  return []
}

function isInvalidApiKeyError(status, errData, msg) {
  const reason = errData?.error?.details?.[0]?.reason || errData?.error?.status || ''
  if (reason === 'API_KEY_INVALID') return true
  if (/API key not valid|API_KEY_INVALID|invalid api key/i.test(msg)) return true
  if (status === 403 && /api key|permission_denied|unregistered callers/i.test(msg)) return true
  return false
}

function classifyScoreLevel(score) {
  if (score >= 65) return 'Tinggi'
  if (score >= 40) return 'Sedang'
  return 'Rendah'
}

async function runGeminiSmartMatching(
  sourceReport,
  candidates,
  apiKey,
  preferredModel = '',
  { forceRefresh = false } = {},
) {
  const chosenModel = normalizeGeminiModel(preferredModel || getGeminiModel())
  // Batasi kandidat yang dikirim ke Gemini pada 10 kandidat paling potensial dengan deskripsi ringkas agar respons 1-2 detik
  const topCandidates = candidates.slice(0, 10)
  const cacheKey = `${sourceReport.id}:${chosenModel || 'auto'}:${topCandidates.map((c) => `${c.id}-${c.score}`).join(',')}`
  const cachedResult = aiMatchesCache.get(cacheKey)
  if (!forceRefresh && cachedResult && Date.now() - cachedResult.timestamp < 120000) {
    return cachedResult.value
  }

  const trimDesc = (text) => String(text || '').trim().slice(0, 180)
  const promptPayload = {
    source_report: {
      id: sourceReport.id,
      type: sourceReport.type,
      title: sourceReport.title,
      category: sourceReport.category,
      color: sourceReport.color || '',
      location: sourceReport.location,
      description: trimDesc(sourceReport.description),
    },
    candidates: topCandidates.map((c) => ({
      id: c.id,
      type: c.type,
      title: c.title,
      category: c.category,
      color: c.color || '',
      location: c.location,
      description: trimDesc(c.description),
      heuristic_score: c.score || 0,
    })),
  }

  const systemInstruction = [
    'Anda adalah AI Smart Matching Lost & Found UNKLAB.',
    'Bandingkan source_report dengan setiap candidates (kemiripan barang, warna, ciri fisik, lokasi kampus).',
    'Berikan ai_score (0-100: >=65 Tinggi, 40-64 Sedang, 15-39 Rendah) dan ai_reason singkat (maks 1 kalimat Bahasa Indonesia) per kandidat.',
  ].join(' ')

  const structuredRequestBody = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: JSON.stringify(promptPayload),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 900,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          evaluations: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                id: { type: 'INTEGER' },
                ai_score: { type: 'INTEGER' },
                ai_reason: { type: 'STRING' },
              },
              required: ['id', 'ai_score', 'ai_reason'],
            },
          },
        },
        required: ['evaluations'],
      },
    },
  }

  const universalRequestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${systemInstruction}\nKembalikan HANYA JSON: {"evaluations":[{"id":1,"ai_score":80,"ai_reason":"..."}]}\nData:\n${JSON.stringify(promptPayload)}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 900,
    },
  }

  const modelQueue = []
  const seenModels = new Set()
  const enqueueModel = (id) => {
    const norm = normalizeGeminiModel(id)
    if (!norm || seenModels.has(norm)) return
    seenModels.add(norm)
    modelQueue.push(norm)
  }

  // 1. Jika pengguna memilih model tertentu, utamakan model tersebut
  if (chosenModel) enqueueModel(chosenModel)

  // 2. Gunakan model yang terakhir terbukti berhasil agar tidak perlu mencoba model lain yang mati
  try {
    const lastWorking = normalizeGeminiModel(sessionStorage.getItem(GEMINI_LAST_WORKING_MODEL))
    if (lastWorking) enqueueModel(lastWorking)
  } catch {
    // Ignore storage error
  }

  // 3. Gunakan daftar model default tercepat terlebih dahulu, baru ambil dari /v1beta/models jika belum ada di cache
  const cachedDiscovered = discoveredModelsCache.get(apiKey)
  if (cachedDiscovered?.models?.length) {
    for (const m of cachedDiscovered.models.slice(0, 5)) {
      if (m.autoScore > 0) enqueueModel(m.id)
    }
  } else {
    // Jalankan penemuan model secara paralel di background untuk mengisi cache tanpa menahan panggilan pertama
    listGeminiModels(apiKey).catch(() => null)
  }

  for (const fallback of DEFAULT_FALLBACK_MODELS) {
    enqueueModel(fallback)
  }

  // Batasi maksimal 4 percobaan model agar tidak pernah menunggu puluhan model secara beruntun
  const maxAttempts = chosenModel ? 3 : 4
  let lastError = null

  for (let i = 0; i < Math.min(modelQueue.length, maxAttempts); i += 1) {
    const model = modelQueue[i]
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
      let response = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(structuredRequestBody),
        },
        7500,
      )

      if (response.status === 400) {
        const errData = await response.json().catch(() => ({}))
        const msg = errData?.error?.message || 'HTTP 400'
        if (isInvalidApiKeyError(response.status, errData, msg)) {
          throw new Error(`API Key Google Gemini tidak valid atau ditolak: ${msg}`)
        }
        response = await fetchWithTimeout(
          endpoint,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(universalRequestBody),
          },
          7500,
        )
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        const msg = errData?.error?.message || `HTTP ${response.status}`
        if (isInvalidApiKeyError(response.status, errData, msg)) {
          throw new Error(`API Key Google Gemini tidak valid atau ditolak: ${msg}`)
        }
        const suggestedMatch = msg.match(/use\s+models\/([a-zA-Z0-9._-]+)/i)
        if (suggestedMatch?.[1]) {
          const suggested = normalizeGeminiModel(suggestedMatch[1])
          if (suggested && !seenModels.has(suggested)) {
            seenModels.add(suggested)
            modelQueue.splice(i + 1, 0, suggested)
          }
        }
        lastError = new Error(msg)
        continue
      }

      const result = await response.json()
      const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
      const evalList = parseEvaluationsJson(rawText)
      const evalMap = new Map(evalList.map((item) => [Number(item.id), item]))

      try {
        sessionStorage.setItem(GEMINI_LAST_WORKING_MODEL, model)
      } catch {
        // Ignore
      }

      const mergedMatches = candidates
        .map((c) => {
          const aiEval = evalMap.get(Number(c.id))
          const baseScore = Number(c.score) || 0
          const aiScore =
            aiEval && typeof aiEval.ai_score === 'number'
              ? Math.max(0, Math.min(100, Math.round(aiEval.ai_score)))
              : baseScore
          const finalScore = Math.min(100, Math.round(Math.max(aiScore, baseScore * 0.85)))
          const aiReasonText = (aiEval?.ai_reason || '').trim()
          const baseReasons = Array.isArray(c.reasons) ? c.reasons : []
          const combinedReasons = aiReasonText
            ? [`Analisis AI Gemini: ${aiReasonText}`, ...baseReasons.slice(0, 2)]
            : baseReasons

          return {
            ...c,
            score: finalScore,
            level: classifyScoreLevel(finalScore),
            reasons: combinedReasons.length > 0 ? combinedReasons : ['Kemiripan atribut laporan'],
            ai_analyzed: Boolean(aiEval),
          }
        })
        .filter((item) => item.score >= 15)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)

      const returnVal = {
        matches: mergedMatches,
        model: `Google Gemini (${model})`,
        model_id: model,
      }
      aiMatchesCache.set(cacheKey, { timestamp: Date.now(), value: returnVal })
      return returnVal
    } catch (err) {
      lastError =
        err?.name === 'AbortError'
          ? new Error(`Model ${model} melebihi batas waktu respons (timeout).`)
          : err
      if (/API Key Google Gemini tidak valid/i.test(err?.message || '')) {
        throw err
      }
    }
  }

  throw lastError || new Error('Gagal memanggil Google Gemini API.')
}

async function rpc(fnName, params = {}) {
  try {
    const { data, error } = await supabase.rpc(fnName, params)
    if (error) {
      const msg = error.message || ''
      // PGRST202: RPC belum ada di database (migrasi Supabase belum dijalankan).
      if (error.code === 'PGRST202') {
        const err = new Error(
          'Fitur ini belum aktif di database. Jalankan migrasi Supabase terbaru (folder supabase/migrations) terlebih dahulu.',
        )
        err.code = 'FEATURE_NOT_MIGRATED'
        throw err
      }
      if (/failed to fetch/i.test(msg)) {
        throw new Error(
          'Gagal terhubung ke server Supabase. Periksa koneksi internet Anda atau muat ulang halaman.',
        )
      }
      throw new Error(msg || 'Permintaan tidak dapat diproses.')
    }
    return data
  } catch (err) {
    if (/failed to fetch/i.test(err?.message || '')) {
      throw new Error(
        'Gagal terhubung ke server Supabase. Periksa koneksi internet Anda atau muat ulang halaman.',
      )
    }
    throw err
  }
}

export const api = {
  async me() {
    const token = getToken()
    if (!token) return { user: null }
    try {
      return await rpc('api_me', { p_token: token })
    } catch {
      setToken('')
      return { user: null }
    }
  },
  async login(email, password) {
    const data = await rpc('api_login', { p_email: email, p_password: password })
    setToken(data.token)
    return { user: data.user }
  },
  async register({ name, email, password, phone = '' }) {
    const data = await rpc('api_register', {
      p_name: name,
      p_email: email,
      p_password: password,
      p_phone: phone || '',
    })
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
  updateReportStatus: (id, status, reason = '') =>
    rpc('api_update_report_status', {
      p_token: getToken(),
      p_report_id: Number(id),
      p_status: status,
      p_reason: reason || '',
    }),
  flagReport: (id, reason, note = '') =>
    rpc('api_flag_report', {
      p_token: getToken(),
      p_report_id: Number(id),
      p_reason: reason,
      p_note: note || '',
    }),
  createReport: (data) =>
    rpc('api_create_report', {
      p_token: getToken(),
      p_type: data.type,
      p_title: data.title,
      p_category: data.category,
      p_location: data.location,
      p_description: data.description,
      p_color: data.color,
      p_reported_at: data.reported_at || null,
      p_image_url: data.image_url || null,
      p_latitude: data.latitude ?? null,
      p_longitude: data.longitude ?? null,
    }),
  updateReport: (id, data) =>
    rpc('api_update_report', {
      p_token: getToken(),
      p_report_id: Number(id),
      p_title: data.title,
      p_category: data.category,
      p_location: data.location,
      p_description: data.description,
      p_color: data.color,
      p_image_url: data.image_url || null,
      p_latitude: data.latitude ?? null,
      p_longitude: data.longitude ?? null,
    }),
  deleteReport: (id) =>
    rpc('api_delete_report', {
      p_token: getToken(),
      p_report_id: Number(id),
    }),
  async uploadReportImage(file, userId) {
    const extensionByType = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    }
    const extension = extensionByType[file?.type]
    if (!extension) throw new Error('Foto harus berformat JPG, PNG, atau WebP.')
    if (file.size > 5 * 1024 * 1024) throw new Error('Ukuran foto maksimal 5 MB.')

    const uniqueId =
      globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const path = `reports/${userId}/${uniqueId}.${extension}`
    const { error } = await supabase.storage
      .from('report-images')
      .upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false })
    if (error) throw new Error(error.message || 'Foto gagal diunggah ke penyimpanan.')

    const { data } = supabase.storage.from('report-images').getPublicUrl(path)
    if (!data?.publicUrl) throw new Error('URL foto yang diunggah tidak dapat dibuat.')
    return data.publicUrl
  },
  report: (id) =>
    rpc('api_report_detail', {
      p_token: getToken(),
      p_report_id: Number(id),
    }),
  reportHistory: (id) =>
    rpc('api_report_history', {
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
  // Profil mahasiswa. Nomor telepon bersifat privat: hanya dikembalikan untuk pemilik akun.
  profile: () => rpc('api_profile', { p_token: getToken() }),
  updateProfile: ({ name, phone }) =>
    rpc('api_update_profile', { p_token: getToken(), p_name: name, p_phone: phone }),
  notifications: () => rpc('api_notifications', { p_token: getToken() }),
  markNotificationsRead: () => rpc('api_mark_notifications_read', { p_token: getToken() }),
  geminiKeySource: getGeminiKeySource,
  hasGeminiKey: () => Boolean(getGeminiKey()),
  saveGeminiKey: (key) => setGeminiKey(key),
  geminiModel: getGeminiModel,
  saveGeminiModel: (model) => setGeminiModel(model),
  listGeminiModels: (customKey, options) => listGeminiModels(customKey, options),
  /**
   * Mencari nama tempat asli (OpenStreetMap Nominatim) untuk titik yang diklik di peta.
   * Mengembalikan { name, lat, lng } atau null bila tidak ditemukan / gagal.
   */
  async reverseGeocode(lat, lng) {
    const key = `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`
    if (reverseGeocodeCache.has(key)) return reverseGeocodeCache.get(key)
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&namedetails=1&accept-language=id&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
    try {
      const response = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 5000)
      if (!response.ok) return null
      const data = await response.json()
      const name = String(data?.name || data?.namedetails?.name || '').trim()
      const result = name ? { name, lat: Number(data.lat), lng: Number(data.lon) } : null
      reverseGeocodeCache.set(key, result)
      return result
    } catch {
      return null
    }
  },
  async smartMatches(reportId, { onBaseResult, forceRefresh = false } = {}) {
    const baseData = await rpc('api_smart_matches', {
      p_token: getToken(),
      p_report_id: Number(reportId),
    })
    const geminiKey = getGeminiKey()
    const preferredModel = getGeminiModel()
    const candidates = Array.isArray(baseData?.candidates)
      ? baseData.candidates
      : Array.isArray(baseData?.matches)
        ? baseData.matches
        : []

    if (!geminiKey || candidates.length === 0) {
      return {
        ...baseData,
        ai_active: Boolean(geminiKey),
        ai_pending: false,
        ai_engine: geminiKey
          ? `Google Gemini (${preferredModel || 'Otomatis / Semua Model'})`
          : 'Heuristik Geospasial & Kata Kunci (Supabase)',
      }
    }

    // Kirim hasil awal dari database secara instan (< 0.2 detik) agar pengguna tidak menunggu layar kosong
    if (typeof onBaseResult === 'function') {
      onBaseResult({
        ...baseData,
        ai_active: false,
        ai_pending: true,
        ai_engine: `Menganalisis dengan Google Gemini (${preferredModel || 'Otomatis'})…`,
      })
    }

    try {
      const aiResult = await runGeminiSmartMatching(
        baseData.report,
        candidates,
        geminiKey,
        preferredModel,
        { forceRefresh },
      )
      return {
        ...baseData,
        matches: aiResult.matches,
        ai_active: true,
        ai_pending: false,
        ai_engine: aiResult.model,
        ai_model_id: aiResult.model_id,
        generated_at: new Date().toISOString(),
      }
    } catch (aiErr) {
      return {
        ...baseData,
        ai_active: false,
        ai_pending: false,
        ai_engine: 'Heuristik Geospasial & Kata Kunci (Fallback)',
        ai_error: aiErr.message || 'Gagal menghubungi Google Gemini API.',
      }
    }
  },
  reportClaims: (reportId) =>
    rpc('api_report_claims', { p_token: getToken(), p_report_id: Number(reportId) }),
  claimDetail: (claimId) =>
    rpc('api_claim_detail', { p_token: getToken(), p_claim_id: Number(claimId) }),
  claimMessages: (claimId) =>
    rpc('api_claim_messages', { p_token: getToken(), p_claim_id: Number(claimId) }),
  sendClaimMessage: (claimId, message) =>
    rpc('api_send_claim_message', {
      p_token: getToken(),
      p_claim_id: Number(claimId),
      p_message: message,
    }),
  decideClaim: (claimId, decision) =>
    rpc('api_decide_claim', {
      p_token: getToken(),
      p_claim_id: Number(claimId),
      p_decision: decision,
    }),
  togglePhoneShare: (claimId, agree) =>
    rpc('api_toggle_phone_share', {
      p_token: getToken(),
      p_claim_id: Number(claimId),
      p_agree: agree,
    }),
}
