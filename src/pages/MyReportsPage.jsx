import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { Link, navigate } from '../router.jsx'

export default function MyReportsPage({ user, onLogout }) {
  const [reports, setReports] = useState([])
  const [incomingClaims, setIncomingClaims] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('Semua')
  const [updatingId, setUpdatingId] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const loadReports = () => {
    setLoading(true)
    setError('')
    api.myReports()
      .then((data) => {
        const rows = data?.reports ?? []
        setReports(rows)
        Promise.all(rows.filter((r) => r.type === 'Found').map(async (r) => {
          try {
            const result = await api.reportClaims(r.id)
            return [r.id, result?.claims ?? []]
          } catch {
            return [r.id, []]
          }
        })).then((entries) => setIncomingClaims(Object.fromEntries(entries)))
      })
      .catch((err) => {
        setError(err.message || 'Gagal memuat laporan Anda.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadReports()
  }, [])

  const handleUpdateStatus = async (id, title, newStatus) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin mengubah status laporan "${title}" menjadi "${newStatus}"?`
    )
    if (!confirmed) return

    setUpdatingId(id)
    setFeedback(null)
    try {
      const result = await api.updateReportStatus(id, newStatus)
      const updated = result?.report
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: updated?.status || newStatus } : r))
      )
      setFeedback({ type: 'success', message: `Status laporan berhasil diubah menjadi "${newStatus}".` })
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Gagal memperbarui status laporan.' })
    } finally {
      setUpdatingId(null)
    }
  }

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchType = type === 'Semua' || r.type === type
      const matchQuery = `${r.title} ${r.category} ${r.location} ${r.description ?? ''}`
        .toLowerCase()
        .includes(query.toLowerCase())
      return matchType && matchQuery
    })
  }, [reports, type, query])

  // Statistics
  const totalCount = reports.length
  const completedCount = reports.filter(
    (r) => r.status === 'Sudah ditemukan' || r.status === 'Sudah dikembalikan'
  ).length
  const activeCount = reports.filter(
    (r) =>
      r.status !== 'Sudah ditemukan' &&
      r.status !== 'Sudah dikembalikan' &&
      r.status !== 'Dibatalkan / Ditutup'
  ).length

  const lostCount = reports.filter((r) => r.type === 'Lost').length
  const foundCount = reports.filter((r) => r.type === 'Found').length

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((x) => x[0])
        .join('')
    : 'U'

  return (
    <div className="sq-page">
      {/* NAVBAR */}
      <header className="sq-navbar">
        <div className="sq-navbar-inner">
          <Link to="/" className="sq-brand" aria-label="Beranda Lost and Found UNKLAB">
            <span className="sq-brand-box">
              <img src="/figma/logo-cube.svg" alt="" width="38" height="43" />
            </span>
            <span className="sq-brand-text">
              Lost and Found<span>.</span>
              <small>UNKLAB</small>
            </span>
          </Link>

          <nav className="sq-nav-links" aria-label="Navigasi Laporan Saya">
            <Link to="/app" className="sq-nav-item">
              Beranda
            </Link>
            <Link to="/app/my-reports" className="sq-nav-item active">
              Laporan Saya
            </Link>
          </nav>

          <div className="sq-account-bar">
            <div className="sq-user-chip">
              <span className="sq-avatar">{initials}</span>
              <div className="sq-user-meta">
                <b>{user?.name ?? 'Mahasiswa'}</b>
                <small>Mahasiswa</small>
              </div>
            </div>
            <button
              type="button"
              className="sq-btn sq-btn-outline sq-logout-btn"
              onClick={onLogout}
            >
              Keluar ↗
            </button>
          </div>
        </div>
      </header>

      <main className="sq-container">
        {/* DASHBOARD HERO */}
        <section className="sq-dash-hero">
          <img
            src="/figma/banner-wave-1.png"
            alt=""
            className="sq-banner-wave"
            aria-hidden="true"
          />
          <div className="sq-banner-dots" aria-hidden="true" />
          <div className="sq-banner-tint" aria-hidden="true" />

          <div className="sq-dash-hero-grid">
            <div className="sq-dash-welcome">
              <span className="sq-kicker-pill">LAPORAN SAYA</span>
              <h1>
                Laporan Saya.
                <br />
                <span>Pantau & Kelola Status.</span>
              </h1>
              <p>
                Kelola semua laporan barang hilang dan temuan yang Anda buat. Tandai barang jika sudah
                kembali ke pemiliknya atau batalkan laporan yang sudah tidak aktif.
              </p>
              <div className="sq-hero-actions">
                <Link to="/app" className="sq-btn sq-btn-outline">
                  ← Kembali ke Dashboard
                </Link>
                <Link to="/app/reports/new" className="sq-btn sq-btn-lime">
                  + Buat Laporan Baru
                </Link>
              </div>
            </div>

            <div className="sq-dash-highlight">
              <div className="sq-icon-badge">
                <img src="/figma/icon-why-1.svg" alt="" width="40" height="40" />
              </div>
              <p>Laporan Aktif Anda</p>
              <strong>{activeCount}</strong>
              <small>Laporan yang sedang menunggu proses penyelesaian</small>
            </div>
          </div>
        </section>

        {/* 3-COLUMN STATS */}
        <section className="sq-dash-stats" aria-label="Ringkasan statistik laporan saya">
          <article className="sq-stat-card">
            <div className="sq-stat-head">
              <div className="sq-icon-badge">
                <img src="/figma/icon-service-3.svg" alt="" width="34" height="34" />
              </div>
              <span className="sq-stat-tag total">TOTAL</span>
            </div>
            <p>Total Laporan Saya</p>
            <strong>{totalCount}</strong>
            <small>Seluruh laporan yang telah Anda buat</small>
          </article>

          <article className="sq-stat-card">
            <div className="sq-stat-head">
              <div className="sq-icon-badge">
                <img src="/figma/icon-service-1.svg" alt="" width="34" height="34" />
              </div>
              <span className="sq-stat-tag lost">AKTIF</span>
            </div>
            <p>Laporan Aktif</p>
            <strong>{activeCount}</strong>
            <small>Masih dicari atau menunggu pemilik</small>
          </article>

          <article className="sq-stat-card">
            <div className="sq-stat-head">
              <div className="sq-icon-badge">
                <img src="/figma/icon-service-2.svg" alt="" width="34" height="34" />
              </div>
              <span className="sq-stat-tag found">SELESAI</span>
            </div>
            <p>Laporan Selesai</p>
            <strong>{completedCount}</strong>
            <small>Sudah ditemukan atau dikembalikan</small>
          </article>
        </section>

        {/* FEEDBACK ALERT IF ANY */}
        {feedback && (
          <div
            style={{
              padding: '16px 24px',
              borderLeft: '1px solid var(--grey-15)',
              borderRight: '1px solid var(--grey-15)',
              borderBottom: '1px solid var(--grey-15)',
              background:
                feedback.type === 'success'
                  ? 'rgba(158, 255, 0, 0.08)'
                  : 'rgba(255, 90, 90, 0.12)',
              color: feedback.type === 'success' ? 'var(--green-50)' : '#ff9b9b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '15px',
            }}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '18px',
              }}
              aria-label="Tutup notifikasi"
            >
              ✕
            </button>
          </div>
        )}

        {/* SECTION DAFTAR LAPORAN */}
        <section className="sq-section">
          {/* TOOLBAR */}
          <div className="sq-dash-toolbar">
            <div>
              <span className="sq-kicker-pill">FILTER LAPORAN</span>
              <h2>Daftar Laporan Anda</h2>
            </div>

            <div className="sq-filters">
              <div className="sq-search-field">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari judul, kategori, atau lokasi..."
                  aria-label="Cari laporan saya"
                />
              </div>
              <select
                className="sq-select-field"
                value={type}
                onChange={(e) => setType(e.target.value)}
                aria-label="Filter tipe laporan"
              >
                <option value="Semua">Semua Tipe ({totalCount})</option>
                <option value="Lost">Barang Hilang ({lostCount})</option>
                <option value="Found">Barang Ditemukan ({foundCount})</option>
              </select>
            </div>
          </div>

          {/* QUICK FILTER TABS */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '14px 44px',
              borderBottom: '1px solid var(--grey-15)',
              background: 'rgba(26, 26, 26, 0.4)',
              flexWrap: 'wrap',
            }}
          >
            {[
              { key: 'Semua', label: 'Semua', count: totalCount },
              { key: 'Lost', label: 'Barang Hilang', count: lostCount },
              { key: 'Found', label: 'Barang Ditemukan', count: foundCount },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`sq-nav-item ${type === tab.key ? 'active' : ''}`}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  fontSize: '14px',
                }}
                onClick={() => setType(tab.key)}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* REPORTS CONTENT / EMPTY STATE */}
          {error ? (
            <div className="sq-state error">
              <b>{error}</b>
              <button type="button" className="sq-btn sq-btn-lime" onClick={loadReports}>
                Coba lagi
              </button>
            </div>
          ) : loading ? (
            <div className="sq-state">Memuat laporan Anda…</div>
          ) : reports.length === 0 ? (
            <div
              className="sq-state"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                padding: '80px 24px',
              }}
            >
              <p style={{ margin: 0, fontSize: '18px', color: 'var(--grey-60)' }}>
                Anda belum pernah membuat laporan barang hilang maupun temuan.
              </p>
              <Link to="/app/reports/new" className="sq-btn sq-btn-lime">
                + Buat Laporan Pertama
              </Link>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="sq-state">
              Tidak ada laporan yang sesuai dengan kata kunci atau filter yang dipilih.
            </div>
          ) : (
            <div className="sq-report-grid">
              {filteredReports.map((r) => {
                const resolvedTargetStatus =
                  r.type === 'Lost' ? 'Sudah ditemukan' : 'Sudah dikembalikan'
                const isResolved = r.status === resolvedTargetStatus
                const isClosed = r.status === 'Dibatalkan / Ditutup'
                const isBusy = updatingId === r.id

                return (
                  <article className={`sq-report-card ${r.type.toLowerCase()}`} key={r.id}>
                    <div className="sq-report-card-header">
                      <span className="sq-report-type-label">
                        {r.type === 'Lost' ? 'BARANG HILANG' : 'BARANG DITEMUKAN'}
                      </span>
                      <em className={`sq-status-badge ${r.type.toLowerCase()}`}>{r.status}</em>
                    </div>

                    {r.type === 'Found' && incomingClaims[r.id]?.length > 0 && (
                      <div className="sq-incoming-claims">
                        <span className="sq-status-badge pending">{incomingClaims[r.id].length} klaim masuk</span>
                        <div className="sq-incoming-claim-links">
                          {incomingClaims[r.id].map((claim) => (
                            <Link key={claim.id} to={`/app/claims/${claim.id}`} className="sq-incoming-claim-link">
                              {claim.claimant_name} · Tinjau klaim
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="sq-report-card-body">
                      <div className="sq-report-top-row">
                        <div className="sq-icon-badge sm">
                          <img
                            src={
                              r.type === 'Found'
                                ? '/figma/icon-service-2.svg'
                                : '/figma/icon-service-1.svg'
                            }
                            alt=""
                            width="28"
                            height="28"
                          />
                        </div>
                        <time className="sq-report-date">
                          {new Date(r.reported_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </time>
                      </div>

                      <h3>{r.title}</h3>

                      <div className="sq-work-pill">
                        {r.category} · {r.location}
                      </div>

                      {r.description && <p className="sq-report-desc">{r.description}</p>}

                      <div className="sq-report-footer">
                        <span className="sq-status-text">
                          Status: <b>{r.status}</b>
                        </span>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '10px',
                          marginTop: '8px',
                          paddingTop: '16px',
                          borderTop: '1px solid var(--grey-15)',
                        }}
                      >
                        <button
                          type="button"
                          className="sq-btn sq-btn-lime"
                          style={{
                            padding: '9px 18px',
                            fontSize: '13px',
                            opacity: isResolved ? 0.6 : 1,
                            cursor: isResolved || isBusy ? 'not-allowed' : 'pointer',
                          }}
                          disabled={isResolved || isBusy}
                          onClick={() => handleUpdateStatus(r.id, r.title, resolvedTargetStatus)}
                          title={
                            isResolved
                              ? `Laporan sudah ditandai ${resolvedTargetStatus}`
                              : `Tandai laporan menjadi ${resolvedTargetStatus}`
                          }
                        >
                          {isBusy ? 'Memproses…' : isResolved ? `✓ ${resolvedTargetStatus}` : resolvedTargetStatus}
                        </button>

                        <button
                          type="button"
                          className="sq-btn sq-btn-outline"
                          style={{
                            padding: '9px 18px',
                            fontSize: '13px',
                            opacity: isClosed ? 0.6 : 1,
                            cursor: isClosed || isBusy ? 'not-allowed' : 'pointer',
                          }}
                          disabled={isClosed || isBusy}
                          onClick={() => handleUpdateStatus(r.id, r.title, 'Dibatalkan / Ditutup')}
                          title={
                            isClosed
                              ? 'Laporan sudah dibatalkan atau ditutup'
                              : 'Batalkan atau tutup laporan ini'
                          }
                        >
                          {isBusy ? 'Memproses…' : isClosed ? '✓ Dibatalkan / Ditutup' : 'Dibatalkan / Ditutup'}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="sq-footer">
        <div className="sq-footer-inner">
          <div className="sq-footer-bottom">
            <div className="sq-footer-contacts">
              <div className="sq-contact-pill">
                <img src="/figma/icon-mail.svg" alt="" width="22" height="22" />
                <span>{user?.email ?? 'student@unklab.ac.id'}</span>
              </div>
              <div className="sq-contact-pill">
                <img src="/figma/icon-location.svg" alt="" width="22" height="22" />
                <span>Portal Mahasiswa Universitas Klabat</span>
              </div>
            </div>
            <p className="sq-copyright">
              © 2026 Lost and Found UNKLAB · Menemukan jalan pulang.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
