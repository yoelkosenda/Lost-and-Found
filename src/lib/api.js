import { supabase } from './supabase.js'

const SESSION_KEY = 'lf_session_token'
const GEMINI_KEY_STORAGE = 'lf_gemini_api_key'
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash']

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

function classifyScoreLevel(score) {
  if (score >= 65) return 'Tinggi'
  if (score >= 40) return 'Sedang'
  return 'Rendah'
}

async function runGeminiSmartMatching(sourceReport, candidates, apiKey) {
  const promptPayload = {
    source_report: {
      id: sourceReport.id,
      type: sourceReport.type,
      title: sourceReport.title,
      category: sourceReport.category,
      color: sourceReport.color || '',
      location: sourceReport.location,
      description: sourceReport.description || '',
    },
    candidates: candidates.map((c) => ({
      id: c.id,
      type: c.type,
      title: c.title,
      category: c.category,
      color: c.color || '',
      location: c.location,
      description: c.description || '',
      heuristic_score: c.score || 0,
      heuristic_reasons: c.reasons || [],
    })),
  }

  const systemInstruction = [
    'Anda adalah sistem AI Smart Matching untuk portal Lost & Found mahasiswa Universitas Klabat (UNKLAB).',
    'Tugas Anda: bandingkan laporan sumber (source_report) dengan setiap kandidat laporan pasangan (candidates).',
    'Analisis kemiripan semantik (sinonim barang, merek/jenis, ciri fisik, warna, kategori, dan kedekatan area kampus UNKLAB).',
    'Berikan skor relevansi 0-100 untuk setiap kandidat:',
    '- 65-100 (Tinggi): Kemungkinan besar barang yang sama (ciri fisik/jenis barang, warna, dan lokasi/konteks sangat mendukung).',
    '- 40-64 (Sedang): Beberapa ciri penting cocok (mis. jenis barang serupa atau warna/area kampus berkaitan).',
    '- 15-39 (Rendah): Hanya sedikit kemiripan umum.',
    '- 0-14: Tidak relevan.',
    'Tuliskan alasan singkat (1-2 poin per kandidat) dalam Bahasa Indonesia yang jelas dan mudah dipahami mahasiswa.',
  ].join(' ')

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Evaluasi daftar kandidat berikut dan kembalikan JSON sesuai skema:\n${JSON.stringify(promptPayload)}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
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

  let lastError = null
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        },
      )

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        const msg = errData?.error?.message || `HTTP ${response.status}`
        if (response.status === 400 || response.status === 403) {
          throw new Error(`API Key Google Gemini tidak valid atau ditolak: ${msg}`)
        }
        lastError = new Error(msg)
        continue
      }

      const result = await response.json()
      const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
      const parsed = JSON.parse(rawText)
      const evalList = Array.isArray(parsed?.evaluations) ? parsed.evaluations : []
      const evalMap = new Map(evalList.map((item) => [Number(item.id), item]))

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

      return {
        matches: mergedMatches,
        model: `Google Gemini (${model})`,
      }
    } catch (err) {
      lastError = err
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
  async smartMatches(reportId) {
    const baseData = await rpc('api_smart_matches', {
      p_token: getToken(),
      p_report_id: Number(reportId),
    })
    const geminiKey = getGeminiKey()
    const candidates = Array.isArray(baseData?.candidates)
      ? baseData.candidates
      : Array.isArray(baseData?.matches)
        ? baseData.matches
        : []

    if (!geminiKey || candidates.length === 0) {
      return {
        ...baseData,
        ai_active: Boolean(geminiKey),
        ai_engine: geminiKey
          ? 'Google Gemini (gemini-2.5-flash)'
          : 'Heuristik Geospasial & Kata Kunci (Supabase)',
      }
    }

    try {
      const aiResult = await runGeminiSmartMatching(baseData.report, candidates, geminiKey)
      return {
        ...baseData,
        matches: aiResult.matches,
        ai_active: true,
        ai_engine: aiResult.model,
        generated_at: new Date().toISOString(),
      }
    } catch (aiErr) {
      return {
        ...baseData,
        ai_active: false,
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
