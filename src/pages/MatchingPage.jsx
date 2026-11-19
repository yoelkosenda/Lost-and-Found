import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api.js'
import { showToast } from '../lib/toast.js'
import { Link } from '../router.jsx'
import AppNavbar from '../components/layout/AppNavbar.jsx'
import AppFooter from '../components/layout/AppFooter.jsx'

const CLOSED_STATUSES = ['Sudah ditemukan', 'Sudah dikembalikan', 'Dibatalkan / Ditutup']
const LEVELS = [
  { key: 'Tinggi', bars: 3, hint: 'Kemungkinan besar barang yang sama' },
  { key: 'Sedang', bars: 2, hint: 'Beberapa ciri cocok, periksa detailnya' },
  { key: 'Rendah', bars: 1, hint: 'Hanya sedikit ciri yang sama' },
]
const levelInfo = (level) => LEVELS.find((l) => l.key === level) ?? LEVELS[2]
const formatDate = (value) =>
  new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const reportFromUrl = () => new URLSearchParams(window.location.search).get('report')

export default function MatchingPage({ user, onLogout }) {
  const [reports, setReports] = useState(null)
  const [reportsError, setReportsError] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [result, setResult] = useState(null)
  const [matching, setMatching] = useState(false)
  const [matchError, setMatchError] = useState('')
  const [levelFilter, setLevelFilter] = useState('Semua')
  const [configOpen, setConfigOpen] = useState(false)
  const [hasGeminiKey, setHasGeminiKey] = useState(() => api.hasGeminiKey())
  const [keySource, setKeySource] = useState(() => api.geminiKeySource())
  const [geminiModel, setGeminiModel] = useState(() => api.geminiModel())
  const activeReqRef = useRef(0)

  const loadReports = () => {
    setReportsError('')
    api
      .myReports()
      .then(({ reports }) => {
        setReports(reports)
        const fromUrl = reportFromUrl()
        const preferred =
          reports.find((r) => String(r.id) === fromUrl) ??
          reports.find((r) => !CLOSED_STATUSES.includes(r.status)) ??
          reports[0]
        setSelectedId(preferred ? String(preferred.id) : '')
      })
      .catch((e) => setReportsError(e.message))
  }

  useEffect(loadReports, [])

  const runMatch = useCallback((id, forceRefresh = false) => {
    if (!id) return
    const reqId = ++activeReqRef.current
    setMatching(true)
    setMatchError('')
    api
      .smartMatches(id, {
        forceRefresh,
        onBaseResult: (baseRes) => {
          if (activeReqRef.current === reqId) {
            setResult(baseRes)
          }
        },
      })
      .then((finalRes) => {
        if (activeReqRef.current === reqId) {
          setResult(finalRes)
        }
      })
      .catch((e) => {
        if (activeReqRef.current === reqId) {
          setResult(null)
          setMatchError(e.message)
        }
      })
      .finally(() => {
        if (activeReqRef.current === reqId) {
          setMatching(false)
        }
      })
  }, [])

  useEffect(() => {
    if (!selectedId) return
    const url = `/app/matching?report=${selectedId}`
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState({}, '', url)
    }
    setLevelFilter('Semua')
    runMatch(selectedId)
  }, [selectedId, runMatch])

  const selected = reports?.find((r) => String(r.id) === selectedId)
  const counts = useMemo(() => {
    const c = { Tinggi: 0, Sedang: 0, Rendah: 0 }
    for (const m of result?.matches ?? []) c[m.level] = (c[m.level] ?? 0) + 1
    return c
  }, [result])
  const shown = (result?.matches ?? []).filter(
    (m) => levelFilter === 'Semua' || m.level === levelFilter,
  )
  const resultIsCurrent = result && String(result.report.id) === selectedId

  return (
    <div className="sq-page">
      <AppNavbar user={user} onLogout={onLogout} active="matching" />

      <main className="sq-container">
        <section className="sq-dash-hero sq-page-hero">
          <img src="/figma/banner-wave-1.png" alt="" className="sq-banner-wave" aria-hidden="true" />
          <div className="sq-banner-dots" aria-hidden="true" />
          <div className="sq-banner-tint" aria-hidden="true" />
          <div className="sq-dash-hero-grid">
            <div className="sq-dash-welcome">
              <span className="sq-kicker-pill">AI SMART MATCHING · GOOGLE GEMINI</span>
              <h1>
                Temukan pasangan
                <br />
                <span>laporan Anda dengan AI.</span>
              </h1>
              <p>
                Pilih salah satu laporan Anda. Sistem memadukan <b>Google Gemini AI</b> (mendukung seluruh model Gemini tanpa batasan untuk analisis semantik deskripsi & ciri barang) dengan pencocokan geospasial gedung kampus UNKLAB.
              </p>
              <div className="sq-hero-actions">
                <button
                  type="button"
                  className="sq-btn sq-btn-outline"
                  onClick={() => setConfigOpen(true)}
                >
                  {hasGeminiKey
                    ? `✨ Google Gemini AI Terhubung (${geminiModel || 'Model Otomatis'})`
                    : '🔑 Hubungkan API Key & Model Google Gemini'}
                </button>
              </div>
            </div>
            <div className="sq-dash-highlight">
              <div className="sq-icon-badge">
                <img src="/figma/icon-why-3.svg" alt="" width="40" height="40" />
              </div>
              <p>Kandidat relevansi Tinggi</p>
              <strong>{resultIsCurrent ? counts.Tinggi : '—'}</strong>
              <small>{selected ? `Untuk "${selected.title}"` : 'Pilih laporan untuk mulai'}</small>
            </div>
          </div>
        </section>

        <section className="sq-section">
          <div className="sq-dash-toolbar">
            <div>
              <span className="sq-kicker-pill">LAPORAN SAYA</span>
              <h2>Pilih laporan untuk dicocokkan</h2>
            </div>
            {reports?.length > 0 && (
              <div className="sq-filters">
                <select
                  className="sq-select-field sq-match-select"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  aria-label="Pilih laporan Anda"
                >
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.type === 'Lost' ? 'Hilang' : 'Ditemukan'} · {r.title}
                      {CLOSED_STATUSES.includes(r.status) ? ` (${r.status})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="sq-btn sq-btn-lime sq-toolbar-btn"
                  onClick={() => {
                    runMatch(selectedId, true)
                    showToast(
                      hasGeminiKey
                        ? 'Google Gemini AI sedang menganalisis ulang kandidat laporan…'
                        : 'Pencocokan ulang Smart Matching dijalankan.',
                      'info',
                    )
                  }}
                  disabled={!selectedId || matching}
                >
                  {matching ? 'Menganalisis AI…' : '✨ Cocokkan ulang'}
                </button>
                <button
                  type="button"
                  className="sq-btn sq-btn-outline sq-toolbar-btn"
                  onClick={() => setConfigOpen(true)}
                  title="Atur API Key Google Gemini (Gratis dari Google AI Studio)"
                >
                  ⚙️ Gemini API
                </button>
              </div>
            )}
          </div>

          <p className="sq-match-note" role="note">
            ⓘ <b>Mesin Aktif:</b>{' '}
            {result?.ai_engine ||
              (hasGeminiKey
                ? `Google Gemini (${geminiModel || 'Otomatis / Semua Model'})`
                : 'Heuristik Geospasial & Kata Kunci (Supabase)')}
            . AI hanya merekomendasikan kandidat berdasarkan kemiripan ciri — tingkat relevansi bukan bukti kepemilikan dan tetap diverifikasi penemu melalui klaim.
          </p>

          {result?.ai_error && (
            <div className="sq-form-error sq-inline-alert" role="alert">
              <span>
                Peringatan Gemini API: {result.ai_error} Menampilkan hasil pencocokan cadangan dari database.
              </span>
              <button
                type="button"
                className="sq-btn sq-btn-outline"
                style={{ marginLeft: '12px', padding: '6px 12px', fontSize: '13px' }}
                onClick={() => setConfigOpen(true)}
              >
                Periksa API Key
              </button>
            </div>
          )}

          {reportsError ? (
            <div className="sq-state error">
              <b>{reportsError}</b>
              <button type="button" className="sq-btn sq-btn-lime" onClick={loadReports}>
                Coba lagi
              </button>
            </div>
          ) : !reports ? (
            <div className="sq-state">Memuat laporan Anda…</div>
          ) : reports.length === 0 ? (
            <div className="sq-state sq-state-empty">
              <span>
                Anda belum memiliki laporan. Buat laporan barang hilang atau temuan untuk mulai mencocokkan.
              </span>
              <Link to="/app/reports/new" className="sq-btn sq-btn-lime">
                + Buat Laporan Pertama
              </Link>
            </div>
          ) : (
            <>
              {selected && (
                <div className="sq-match-source">
                  <em className={`sq-status-badge ${selected.type.toLowerCase()}`}>
                    {selected.type === 'Lost' ? 'Barang hilang' : 'Barang ditemukan'} · {selected.status}
                  </em>
                  <div>
                    <h3>{selected.title}</h3>
                    <p>
                      {selected.category} · {selected.location}
                      {selected.color ? ` · Warna: ${selected.color}` : ''} ·{' '}
                      {formatDate(selected.reported_at)}
                    </p>
                  </div>
                  <span className="sq-match-direction">
                    Mencari laporan{' '}
                    <b>{selected.type === 'Lost' ? 'barang ditemukan' : 'barang hilang'}</b>
                  </span>
                </div>
              )}

              {selected && CLOSED_STATUSES.includes(selected.status) && (
                <p className="sq-match-note" role="note">
                  Laporan ini sudah berstatus "{selected.status}". Kandidat tetap ditampilkan sebagai referensi.
                </p>
              )}

              {matchError ? (
                <div className="sq-state error">
                  <b>{matchError}</b>
                  <button
                    type="button"
                    className="sq-btn sq-btn-lime"
                    onClick={() => runMatch(selectedId)}
                  >
                    Coba lagi
                  </button>
                </div>
              ) : !resultIsCurrent ? (
                <div className="sq-state">
                  {hasGeminiKey
                    ? 'Google Gemini AI sedang menganalisis kemiripan laporan…'
                    : 'Mencocokkan laporan…'}
                </div>
              ) : result.matches.length === 0 ? (
                <div className="sq-state">
                  Belum ada laporan pasangan yang cocok. Kami akan mengirim notifikasi saat laporan dengan relevansi Tinggi masuk.
                </div>
              ) : (
                <>
                  <div className="sq-match-summary" aria-live="polite">
                    <div className="sq-segmented" role="group" aria-label="Filter tingkat relevansi">
                      {['Semua', 'Tinggi', 'Sedang', 'Rendah'].map((key) => (
                        <button
                          key={key}
                          type="button"
                          className={levelFilter === key ? 'active' : ''}
                          aria-pressed={levelFilter === key}
                          onClick={() => setLevelFilter(key)}
                        >
                          {key} ({key === 'Semua' ? result.matches.length : counts[key]})
                        </button>
                      ))}
                    </div>
                    <span className="sq-match-time">
                      {result.ai_pending
                        ? '⏳ Menyempurnakan skor dengan Gemini AI… · '
                        : result.ai_active
                          ? '✨ Dianalisis Gemini AI · '
                          : 'Dicocokkan · '}
                      {new Date(result.generated_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {shown.length === 0 ? (
                    <div className="sq-state">
                      Tidak ada kandidat dengan relevansi {levelFilter}.
                    </div>
                  ) : (
                    <div className="sq-report-grid">
                      {shown.map((m) => {
                        const level = levelInfo(m.level)
                        return (
                          <article className={`sq-report-card ${m.type.toLowerCase()}`} key={m.id}>
                            <div className="sq-report-card-header">
                              <span className="sq-report-type-label">
                                {m.type === 'Lost' ? 'BARANG HILANG' : 'BARANG DITEMUKAN'}
                              </span>
                              <span className={`sq-match-level ${m.level.toLowerCase()}`}>
                                <span className="sq-match-bars" aria-hidden="true">
                                  {[1, 2, 3].map((i) => (
                                    <i key={i} className={i <= level.bars ? 'on' : ''} />
                                  ))}
                                </span>
                                Relevansi {m.level}
                              </span>
                            </div>

                            <div className="sq-report-card-body">
                              <div className="sq-report-top-row">
                                <div className="sq-match-score" title={level.hint}>
                                  <strong>{m.score}%</strong>
                                  <span>
                                    {m.ai_analyzed ? 'skor AI Gemini' : 'skor kecocokan'}
                                  </span>
                                </div>
                                <time className="sq-report-date" dateTime={m.reported_at}>
                                  {formatDate(m.reported_at)}
                                </time>
                              </div>

                              <h3>{m.title}</h3>
                              <div className="sq-work-pill">
                                {m.category} · {m.location}
                                {m.color ? ` · Warna: ${m.color}` : ''}
                              </div>
                              {m.description && <p className="sq-report-desc">{m.description}</p>}

                              <ul className="sq-match-reasons" aria-label="Alasan kecocokan">
                                {m.reasons.map((reason) => (
                                  <li key={reason}>
                                    <img src="/figma/icon-check.svg" alt="" width="14" height="14" />
                                    {reason}
                                  </li>
                                ))}
                              </ul>

                              <div className="sq-report-footer">
                                <span className="sq-status-text">{m.status}</span>
                                <Link
                                  to={`/app/reports/${m.id}`}
                                  className="sq-btn sq-btn-outline sq-match-detail"
                                >
                                  Lihat detail ↗
                                </Link>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </main>

      <AppFooter user={user} />

      {configOpen && (
        <GeminiConfigDialog
          hasEnvKey={keySource === 'env'}
          hasCustomKey={keySource === 'custom'}
          initialModel={geminiModel}
          onClose={() => setConfigOpen(false)}
          onSaved={({ newKey, updateKey, newModel }) => {
            if (updateKey) {
              api.saveGeminiKey(newKey)
            }
            api.saveGeminiModel(newModel)
            const nowHasKey = api.hasGeminiKey()
            const nowModel = api.geminiModel()
            setHasGeminiKey(nowHasKey)
            setKeySource(api.geminiKeySource())
            setGeminiModel(nowModel)
            setConfigOpen(false)
            showToast(
              nowHasKey
                ? `Konfigurasi Google Gemini (${nowModel || 'Otomatis / Semua Model'}) disimpan! Menjalankan analisis AI…`
                : 'Konfigurasi Google Gemini diperbarui.',
              'success',
            )
            if (selectedId) runMatch(selectedId)
          }}
        />
      )}
    </div>
  )
}

function GeminiConfigDialog({ hasEnvKey, hasCustomKey, initialModel, onClose, onSaved }) {
  const dialogRef = useRef(null)
  const [keyInput, setKeyInput] = useState('')
  const [modelInput, setModelInput] = useState(initialModel || '')
  const [availableModels, setAvailableModels] = useState([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsNotice, setModelsNotice] = useState('')
  const [error, setError] = useState('')

  const fetchModels = useCallback(async (customKey = '', forceRefresh = false) => {
    setLoadingModels(true)
    setModelsNotice('')
    try {
      const models = await api.listGeminiModels(customKey, { forceRefresh })
      setAvailableModels(models)
      if (models.length > 0) {
        setModelsNotice(`Ditemukan ${models.length} model Gemini yang tersedia untuk API Key Anda.`)
      }
    } catch (err) {
      setModelsNotice(`Gagal memuat daftar model: ${err.message}`)
    } finally {
      setLoadingModels(false)
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (hasEnvKey || hasCustomKey) {
      fetchModels('', false)
    }
    return () => {
      document.body.style.overflow = prevOverflow
      if (dialog?.open) dialog.close()
    }
  }, [hasEnvKey, hasCustomKey, fetchModels])

  const submit = (e) => {
    e.preventDefault()
    const trimmedKey = keyInput.trim()
    const trimmedModel = modelInput.trim().replace(/^models\//i, '')
    if (!trimmedKey && !hasEnvKey && !hasCustomKey) {
      setError('Masukkan API Key Google Gemini (biasanya diawali AIza...).')
      return
    }
    onSaved({
      newKey: trimmedKey,
      updateKey: Boolean(trimmedKey),
      newModel: trimmedModel,
    })
  }

  return (
    <dialog
      ref={dialogRef}
      className="sq-claim-dialog"
      aria-labelledby="gemini-config-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
    >
      <form className="sq-form-box sq-claim-box" onSubmit={submit} noValidate>
        <div className="sq-claim-head">
          <span className="sq-kicker-pill">GOOGLE GEMINI AI · SEMUA MODEL</span>
          <h2 id="gemini-config-title">Konfigurasi API Key & Model Google Gemini</h2>
          <p className="sq-claim-item">
            Tidak ada batasan model: gunakan mode <b>Otomatis</b> (mendeteksi seluruh model yang aktif di akun Anda) atau ketik/pilih model Gemini apa pun secara bebas.
          </p>
        </div>

        <p className="sq-claim-privacy">
          Anda dapat mengatur <code>VITE_GEMINI_API_KEY</code> dan <code>VITE_GEMINI_MODEL</code> di file <code>.env</code>, atau langsung mengaturnya dari{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--green-50)', textDecoration: 'underline' }}
          >
            Google AI Studio (aistudio.google.com/apikey) ↗
          </a>{' '}
          di bawah ini.
        </p>

        {hasEnvKey && !hasCustomKey && (
          <p className="sq-claim-handover-note" role="status">
            ✓ Saat ini sistem sudah membaca <code>VITE_GEMINI_API_KEY</code> dari konfigurasi <code>.env</code>. Biarkan kolom API Key kosong jika hanya ingin mengganti model.
          </p>
        )}
        {hasCustomKey && (
          <p className="sq-claim-completed-note" role="status">
            ✓ API Key Google Gemini kustom sudah tersimpan di browser Anda. Biarkan kolom API Key kosong jika hanya ingin mengganti model.
          </p>
        )}

        {error && (
          <div className="sq-form-error" role="alert">
            {error}
          </div>
        )}

        <label className="sq-input-card">
          <span className="sq-input-label">Google Gemini API Key</span>
          <div className="sq-input-underline">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value)
                setError('')
              }}
              placeholder={
                hasEnvKey || hasCustomKey
                  ? 'Sudah terhubung (isi untuk mengganti API Key baru)...'
                  : 'AIzaSy...'
              }
              autoComplete="off"
            />
          </div>
          <small className="sq-field-hint">
            Disimpan secara lokal di browser Anda dan hanya dikirim ke endpoint resmi <code>generativelanguage.googleapis.com</code>.
          </small>
        </label>

        <div className="sq-input-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <label htmlFor="gemini-model-input" className="sq-input-label" style={{ marginBottom: 0 }}>
              Model Gemini (Bebas / Tanpa Batasan)
            </label>
            <button
              type="button"
              className="sq-btn sq-btn-outline"
              style={{ padding: '4px 10px', fontSize: '12px' }}
              disabled={loadingModels || (!keyInput.trim() && !hasEnvKey && !hasCustomKey)}
              onClick={() => fetchModels(keyInput.trim(), true)}
            >
              {loadingModels ? 'Memuat daftar model…' : '🔄 Muat Daftar Model dari API'}
            </button>
          </div>
          <div className="sq-input-underline">
            <input
              id="gemini-model-input"
              type="text"
              list="gemini-models-datalist"
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              placeholder="Kosongkan untuk Otomatis (mis. gemini-3.8-flash, gemini-2.5-pro, dll.)"
              autoComplete="off"
            />
            <datalist id="gemini-models-datalist">
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))}
            </datalist>
          </div>
          <small className="sq-field-hint">
            Kosongkan untuk <b>Mode Otomatis</b> (sistem mendeteksi semua model di API Key Anda dan otomatis mencoba model yang aktif). Atau ketik/pilih ID model Gemini apa saja tanpa batasan.
          </small>
          {modelsNotice && (
            <small className="sq-field-hint" style={{ color: 'var(--green-50)', marginTop: '6px', display: 'block' }}>
              {modelsNotice}
            </small>
          )}
          {availableModels.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px', maxHeight: '130px', overflowY: 'auto' }}>
              <button
                type="button"
                className={`sq-btn ${!modelInput.trim() ? 'sq-btn-lime' : 'sq-btn-outline'}`}
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={() => setModelInput('')}
              >
                ✨ Otomatis (Semua Model)
              </button>
              {availableModels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`sq-btn ${modelInput.trim() === m.id ? 'sq-btn-lime' : 'sq-btn-outline'}`}
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => setModelInput(m.id)}
                  title={m.description || m.displayName}
                >
                  {m.id}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sq-claim-actions">
          <button type="button" className="sq-btn sq-btn-outline" onClick={onClose}>
            Tutup
          </button>
          {hasCustomKey && (
            <button
              type="button"
              className="sq-btn sq-btn-outline sq-btn-danger"
              onClick={() => onSaved({ newKey: '', updateKey: true, newModel: modelInput.trim() })}
            >
              Hapus Key Kustom
            </button>
          )}
          <button type="submit" className="sq-btn sq-btn-lime">
            Simpan & Aktifkan Gemini AI
          </button>
        </div>
      </form>
    </dialog>
  )
}
