import { useCallback, useEffect, useMemo, useState } from 'react'
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

  const runMatch = useCallback((id) => {
    if (!id) return
    setMatching(true)
    setMatchError('')
    api
      .smartMatches(id)
      .then(setResult)
      .catch((e) => {
        setResult(null)
        setMatchError(e.message)
      })
      .finally(() => setMatching(false))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    // Simpan pilihan di URL (?report=ID) agar tautan dari notifikasi dan tombol kembali tetap konsisten.
    const url = `/app/matching?report=${selectedId}`
    if (window.location.pathname + window.location.search !== url) window.history.replaceState({}, '', url)
    setLevelFilter('Semua')
    runMatch(selectedId)
  }, [selectedId, runMatch])

  const selected = reports?.find((r) => String(r.id) === selectedId)
  const counts = useMemo(() => {
    const c = { Tinggi: 0, Sedang: 0, Rendah: 0 }
    for (const m of result?.matches ?? []) c[m.level] = (c[m.level] ?? 0) + 1
    return c
  }, [result])
  const shown = (result?.matches ?? []).filter((m) => levelFilter === 'Semua' || m.level === levelFilter)
  // Hasil lama tetap tampil saat "Cocokkan ulang" berjalan, kecuali jika laporan yang dipilih berganti.
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
              <span className="sq-kicker-pill">SMART MATCHING</span>
              <h1>
                Temukan pasangan
                <br />
                <span>laporan Anda.</span>
              </h1>
              <p>
                Pilih salah satu laporan Anda. Sistem mencari laporan pasangan (hilang ↔ ditemukan) berdasarkan kategori,
                lokasi kampus, dan kata kunci yang sama.
              </p>
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
                    runMatch(selectedId)
                    showToast('Pencocokan ulang Smart Matching dijalankan.', 'info')
                  }}
                  disabled={!selectedId || matching}
                >
                  {matching ? 'Mencocokkan…' : 'Cocokkan ulang'}
                </button>
              </div>
            )}
          </div>

          <p className="sq-match-note" role="note">
            ⓘ Smart Matching hanya merekomendasikan kandidat berdasarkan kemiripan ciri. Tingkat relevansi bukan peluang kepemilikan dan bukan bukti — kepemilikan tetap diverifikasi oleh penemu melalui pengajuan klaim.
          </p>

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
              <span>Anda belum memiliki laporan. Buat laporan barang hilang atau temuan untuk mulai mencocokkan.</span>
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
                      {selected.category} · {selected.location} · {formatDate(selected.reported_at)}
                    </p>
                  </div>
                  <span className="sq-match-direction">
                    Mencari laporan <b>{selected.type === 'Lost' ? 'barang ditemukan' : 'barang hilang'}</b>
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
                  <button type="button" className="sq-btn sq-btn-lime" onClick={() => runMatch(selectedId)}>
                    Coba lagi
                  </button>
                </div>
              ) : !resultIsCurrent ? (
                <div className="sq-state">Mencocokkan laporan…</div>
              ) : result.matches.length === 0 ? (
                <div className="sq-state">
                  Belum ada laporan pasangan yang cocok. Kami akan mengirim notifikasi saat laporan dengan relevansi Tinggi
                  masuk.
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
                      Dicocokkan{' '}
                      {new Date(result.generated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {shown.length === 0 ? (
                    <div className="sq-state">Tidak ada kandidat dengan relevansi {levelFilter}.</div>
                  ) : (
                    <div className={`sq-report-grid${matching ? ' sq-is-refreshing' : ''}`}>
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
                                  <span>skor kecocokan</span>
                                </div>
                                <time className="sq-report-date" dateTime={m.reported_at}>
                                  {formatDate(m.reported_at)}
                                </time>
                              </div>

                              <h3>{m.title}</h3>
                              <div className="sq-work-pill">
                                {m.category} · {m.location}
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
                                <Link to={`/app/reports/${m.id}`} className="sq-btn sq-btn-outline sq-match-detail">
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
    </div>
  )
}
