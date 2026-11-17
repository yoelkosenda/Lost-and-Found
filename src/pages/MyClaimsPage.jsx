import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { claimStatus } from '../lib/claimStatus.js'
import { Link } from '../router.jsx'

// SQLite menyimpan CURRENT_TIMESTAMP dalam UTC ("YYYY-MM-DD HH:MM:SS").
const formatDate = (value) =>
  new Date(`${value.replace(' ', 'T')}Z`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

export default function MyClaimsPage({ user, onLogout }) {
  const [claims, setClaims] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    setError('')
    api
      .myClaims()
      .then(({ claims }) => setClaims(claims))
      .catch((e) => setError(e.message))
  }

  useEffect(load, [])

  const count = (...statuses) => (claims ? claims.filter((c) => statuses.includes(c.status)).length : '—')
  const initials = user.name
    .split(' ')
    .map((x) => x[0])
    .join('')

  return (
    <div className="sq-page">
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

          <nav className="sq-nav-links" aria-label="Navigasi Dashboard">
            <Link to="/app" className="sq-nav-item">Dashboard</Link>
            <Link to="/app/my-claims" className="sq-nav-item active" aria-current="page">Klaim Saya</Link>
          </nav>

          <div className="sq-account-bar">
            <div className="sq-user-chip">
              <span className="sq-avatar">{initials}</span>
              <div className="sq-user-meta">
                <b>{user.name}</b>
                <small>Mahasiswa</small>
              </div>
            </div>
            <button type="button" className="sq-btn sq-btn-outline sq-logout-btn" onClick={onLogout}>
              Keluar ↗
            </button>
          </div>
        </div>
      </header>

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
                <span>Pantau proses verifikasinya.</span>
              </h1>
              <p>
                Semua barang temuan yang pernah Anda klaim ada di sini. Bukti kepemilikan yang Anda kirim hanya terlihat
                oleh Anda dan dipakai untuk verifikasi.
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
            <p>Klaim Diterima</p>
            <strong>{count('approved', 'accepted')}</strong>
            <small>Bukti kepemilikan cocok</small>
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
          </div>

          {error ? (
            <div className="sq-state error">
              <b>{error}</b>
              <button type="button" className="sq-btn sq-btn-lime" onClick={load}>
                Coba lagi
              </button>
            </div>
          ) : !claims ? (
            <div className="sq-state">Memuat riwayat klaim Anda…</div>
          ) : claims.length ? (
            <div className="sq-report-grid">
              {claims.map((c) => {
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
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="sq-state sq-state-empty">
              <span>Anda belum pernah mengajukan klaim. Temukan barang Anda di daftar barang temuan.</span>
              <Link to="/app" className="sq-btn sq-btn-lime">
                Lihat Barang Temuan
              </Link>
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
