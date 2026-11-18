import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { claimStatus } from '../lib/claimStatus.js'
import { Link } from '../router.jsx'
import AppNavbar from '../components/layout/AppNavbar.jsx'

const formatDate = (value) => {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function MyClaimsPage({ user, onLogout }) {
  const [claims, setClaims] = useState(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusTab, setStatusTab] = useState('all')

  const load = () => {
    setError('')
    api
      .myClaims()
      .then(({ claims }) => setClaims(claims))
      .catch((e) => setError(e.message))
  }

  useEffect(load, [])

  const count = (...statuses) =>
    claims ? claims.filter((c) => statuses.includes(c.status)).length : '—'

  const filteredClaims = useMemo(() => {
    if (!claims) return []
    return claims.filter((c) => {
      if (statusTab === 'pending' && c.status !== 'pending') return false
      if (statusTab === 'handover' && !['approved', 'accepted'].includes(c.status)) return false
      if (statusTab === 'completed' && c.status !== 'completed') return false
      if (statusTab === 'rejected' && c.status !== 'rejected') return false
      if (
        query.trim() &&
        !`${c.report_title ?? ''} ${c.report_category ?? ''} ${c.report_location ?? ''} ${c.message ?? ''}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [claims, statusTab, query])

  return (
    <div className="sq-page">
      <AppNavbar user={user} onLogout={onLogout} active="my-claims" />

      <main className="sq-container">
        <section className="sq-dash-hero">
          <img src="/figma/banner-wave-2.png" alt="" className="sq-banner-wave" aria-hidden="true" />
          <div className="sq-banner-dots" aria-hidden="true" />
          <div className="sq-banner-tint" aria-hidden="true" />

          <div className="sq-dash-hero-grid">
            <div className="sq-dash-welcome">
              <span className="sq-kicker-pill">RIWAYAT KLAIM SAYA</span>
              <h1>
                Klaim Saya.
                <br />
                <span>Pantau verifikasi & serah terima.</span>
              </h1>
              <p>
                Semua barang temuan yang pernah Anda klaim ada di sini. Bukti kepemilikan yang Anda kirim bersifat rahasia dan hanya terlihat oleh penemu barang untuk verifikasi.
              </p>
              <div className="sq-hero-actions">
                <Link to="/app" className="sq-btn sq-btn-lime">
                  Jelajahi Barang Temuan
                </Link>
              </div>
            </div>

            <div className="sq-dash-highlight">
              <div className="sq-icon-badge">
                <img src="/figma/icon-service-3.svg" alt="" width="40" height="40" />
              </div>
              <p>Total klaim diajukan</p>
              <strong>{claims ? claims.length : '—'}</strong>
              <small>Atas barang temuan komunitas UNKLAB</small>
            </div>
          </div>
        </section>

        <section className="sq-dash-stats" aria-label="Ringkasan status klaim">
          <article className="sq-stat-card">
            <p>Menunggu Verifikasi</p>
            <strong>{count('pending')}</strong>
            <small>Sedang diperiksa penemu barang</small>
          </article>
          <article className="sq-stat-card">
            <p>Disetujui / Dikembalikan</p>
            <strong>{count('approved', 'accepted', 'completed')}</strong>
            <small>Tahap serah terima atau selesai</small>
          </article>
          <article className="sq-stat-card">
            <p>Klaim Ditolak</p>
            <strong>{count('rejected')}</strong>
            <small>Bukti belum cocok</small>
          </article>
        </section>

        <section className="sq-section">
          <div className="sq-dash-toolbar">
            <div>
              <span className="sq-kicker-pill">DAFTAR KLAIM</span>
              <h2>Barang yang Anda Klaim</h2>
            </div>

            <div className="sq-filters">
              <div className="sq-search-field">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari judul, lokasi, atau bukti klaim..."
                  aria-label="Cari klaim saya"
                />
              </div>
            </div>
          </div>

          {claims && claims.length > 0 && (
            <div
              role="tablist"
              aria-label="Filter status klaim"
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
                { key: 'all', label: 'Semua', num: claims.length },
                { key: 'pending', label: 'Menunggu Verifikasi', num: count('pending') },
                { key: 'handover', label: 'Tahap Serah Terima', num: count('approved', 'accepted') },
                { key: 'completed', label: 'Sudah Dikembalikan', num: count('completed') },
                { key: 'rejected', label: 'Ditolak', num: count('rejected') },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={statusTab === tab.key}
                  className={`sq-nav-item ${statusTab === tab.key ? 'active' : ''}`}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 16px',
                    fontSize: '14px',
                  }}
                  onClick={() => setStatusTab(tab.key)}
                >
                  {tab.label} ({tab.num})
                </button>
              ))}
            </div>
          )}

          {error ? (
            <div className="sq-state error">
              <b>{error}</b>
              <button type="button" className="sq-btn sq-btn-lime" onClick={load}>
                Coba lagi
              </button>
            </div>
          ) : !claims ? (
            <div className="sq-state">Memuat riwayat klaim Anda…</div>
          ) : claims.length === 0 ? (
            <div className="sq-state sq-state-empty">
              <span>Anda belum pernah mengajukan klaim. Temukan barang Anda di daftar barang temuan.</span>
              <Link to="/app" className="sq-btn sq-btn-lime">
                Lihat Barang Temuan
              </Link>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="sq-state">
              Tidak ada klaim yang cocok dengan filter status atau kata kunci yang dipilih.
            </div>
          ) : (
            <div className="sq-report-grid">
              {filteredClaims.map((c) => {
                const status = claimStatus(c.status)
                return (
                  <article className="sq-report-card found" key={c.id}>
                    <div className="sq-report-card-header">
                      <span className="sq-report-type-label">KLAIM BARANG DITEMUKAN</span>
                      <em className={`sq-status-badge ${status.badge}`}>{status.label}</em>
                    </div>

                    <div className="sq-report-card-body">
                      <div className="sq-report-top-row">
                        <div className="sq-icon-badge sm">
                          <img src="/figma/icon-service-2.svg" alt="" width="28" height="28" />
                        </div>
                        <time className="sq-report-date">Diajukan {formatDate(c.submitted_at)}</time>
                      </div>

                      <h3>{c.report_title}</h3>

                      <div className="sq-work-pill">
                        {c.report_category} · {c.report_location}
                      </div>

                      <details className="sq-claim-proof">
                        <summary>Lihat bukti yang Anda kirim (rahasia)</summary>
                        <p>{c.message}</p>
                      </details>

                      <div className="sq-report-footer">
                        <span className="sq-status-text">{status.note || status.label}</span>
                        <span className="sq-claim-code">#LF-{c.report_id}</span>
                      </div>
                      <Link to={`/app/claims/${c.id}`} className="sq-btn sq-btn-outline sq-claim-open-link">
                        Buka ruang klaim
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="sq-footer">
        <div className="sq-footer-inner">
          <div className="sq-footer-bottom">
            <div className="sq-footer-contacts">
              <div className="sq-contact-pill">
                <img src="/figma/icon-mail.svg" alt="" width="22" height="22" />
                <span>{user.email}</span>
              </div>
              <div className="sq-contact-pill">
                <img src="/figma/icon-location.svg" alt="" width="22" height="22" />
                <span>Portal Mahasiswa Universitas Klabat</span>
              </div>
            </div>
            <p className="sq-copyright">© 2026 Lost and Found UNKLAB · Menemukan jalan pulang.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
