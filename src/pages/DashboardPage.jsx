import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { Link } from '../router.jsx'

export default function DashboardPage({ user, onLogout }) {
  const [data, setData] = useState(null)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('Semua')
  const [error, setError] = useState('')

  const load = () => {
    setError('')
    api.reports().then(setData).catch((e) => setError(e.message))
  }

  useEffect(load, [])

  const reports = useMemo(
    () =>
      (data?.reports ?? []).filter(
        (r) =>
          (type === 'Semua' || r.type === type) &&
          `${r.title} ${r.category} ${r.location}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [data, query, type],
  )

  const found = data?.reports.filter((r) => r.type === 'Found').length ?? 0
  const lost = data?.reports.filter((r) => r.type === 'Lost').length ?? 0
  const total = data?.reports.length ?? '—'
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
            <a href="#ringkasan" className="sq-nav-item active">Ringkasan</a>
            <a href="#laporan" className="sq-nav-item">Laporan</a>
            <a href="#aktivitas" className="sq-nav-item">Aktivitas</a>
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
        {/* DASHBOARD HERO BANNER */}
        <section id="ringkasan" className="sq-dash-hero">
          <img src="/figma/banner-wave-1.png" alt="" className="sq-banner-wave" aria-hidden="true" />
          <div className="sq-banner-dots" aria-hidden="true" />
          <div className="sq-banner-tint" aria-hidden="true" />

          <div className="sq-dash-hero-grid">
            <div className="sq-dash-welcome">
              <span className="sq-kicker-pill">RUANG KOMUNITAS UNKLAB</span>
              <h1>
                Halo, {user.name.split(' ')[0]}.
                <br />
                <span>Ada kabar baik hari ini.</span>
              </h1>
              <p>
                Temukan laporan terbaru dari sekitar kampus Universitas Klabat dan bantu satu barang berharga kembali ke tangan pemiliknya.
              </p>
              <div className="sq-hero-actions">
                <Link to="/app/reports/new" className="sq-btn sq-btn-lime">
                  + Buat laporan
                </Link>
                <a href="#laporan" className="sq-btn sq-btn-outline">
                  Jelajahi Laporan ↓
                </a>
              </div>
            </div>

            <div className="sq-dash-highlight">
              <div className="sq-icon-badge">
                <img src="/figma/icon-why-1.svg" alt="" width="40" height="40" />
              </div>
              <p>Barang ditemukan minggu ini</p>
              <strong>{found}</strong>
              <small>Laporan aktif dari komunitas mahasiswa</small>
            </div>
          </div>
        </section>

        {/* STATS ROW (Figma 3-column bordered cards) */}
        <section className="sq-dash-stats" aria-label="Ringkasan statistik laporan">
          <article className="sq-stat-card">
            <div className="sq-stat-head">
              <div className="sq-icon-badge">
                <img src="/figma/icon-service-1.svg" alt="" width="34" height="34" />
              </div>
              <span className="sq-stat-tag lost">LOST</span>
            </div>
            <p>Barang hilang</p>
            <strong>{lost}</strong>
            <small>Butuh perhatian komunitas</small>
          </article>

          <article className="sq-stat-card">
            <div className="sq-stat-head">
              <div className="sq-icon-badge">
                <img src="/figma/icon-service-2.svg" alt="" width="34" height="34" />
              </div>
              <span className="sq-stat-tag found">FOUND</span>
            </div>
            <p>Barang ditemukan</p>
            <strong>{found}</strong>
            <small>Menunggu pemilik sah</small>
          </article>

          <article className="sq-stat-card">
            <div className="sq-stat-head">
              <div className="sq-icon-badge">
                <img src="/figma/icon-service-3.svg" alt="" width="34" height="34" />
              </div>
              <span className="sq-stat-tag total">TOTAL</span>
            </div>
            <p>Total laporan</p>
            <strong>{total}</strong>
            <small>Di komunitas UNKLAB Anda</small>
          </article>
        </section>

        {/* REPORTS SECTION */}
        <section id="laporan" className="sq-section">
          <div className="sq-dash-toolbar">
            <div>
              <span className="sq-kicker-pill">JELAJAHI LAPORAN</span>
              <h2>Yang Baru di Sekitar Anda</h2>
            </div>

            <div className="sq-filters">
              <div className="sq-search-field">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari barang, kategori, atau lokasi..."
                  aria-label="Cari barang atau lokasi"
                />
              </div>
              <select
                className="sq-select-field"
                value={type}
                onChange={(e) => setType(e.target.value)}
                aria-label="Filter tipe laporan"
              >
                <option value="Semua">Semua Tipe</option>
                <option value="Lost">Lost (Hilang)</option>
                <option value="Found">Found (Ditemukan)</option>
              </select>
            </div>
          </div>

          {error ? (
            <div className="sq-state error">
              <b>{error}</b>
              <button type="button" className="sq-btn sq-btn-lime" onClick={load}>
                Coba lagi
              </button>
            </div>
          ) : !data ? (
            <div className="sq-state">Memuat laporan komunitas…</div>
          ) : reports.length ? (
            <div className="sq-report-grid">
              {reports.map((r) => (
                <article className={`sq-report-card ${r.type.toLowerCase()}`} key={r.id}>
                  <div className="sq-report-card-header">
                    <span className="sq-report-type-label">
                      {r.type === 'Lost' ? 'BARANG HILANG' : 'BARANG DITEMUKAN'}
                    </span>
                    <em className={`sq-status-badge ${r.type.toLowerCase()}`}>{r.status}</em>
                  </div>

                  <div className="sq-report-card-body">
                    <div className="sq-report-top-row">
                      <div className="sq-icon-badge sm">
                        <img
                          src={r.type === 'Found' ? '/figma/icon-service-2.svg' : '/figma/icon-service-1.svg'}
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
                      <span className="sq-status-text">{r.status}</span>
                      <span className="sq-icon-action sm" aria-hidden="true">
                        <img src="/figma/icon-arrow-up-right.svg" alt="" width="22" height="22" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="sq-state">
              Tidak ada laporan yang sesuai. Coba kata kunci atau filter lain.
            </div>
          )}
        </section>

        {/* ACTIVITY / COMMUNITY FOOTER BANNER */}
        <section id="aktivitas" className="sq-cta-banner">
          <img src="/figma/cta-wave.png" alt="" className="sq-banner-wave" aria-hidden="true" />
          <div className="sq-banner-dots" aria-hidden="true" />
          <div className="sq-banner-tint" aria-hidden="true" />
          <div className="sq-cta-content">
            <div className="sq-cta-logo">
              <img src="/figma/logo-cube.svg" alt="" width="44" height="50" />
            </div>
            <span className="sq-kicker-pill">JEJAK KOMUNITAS</span>
            <h2>Hal Kecil, Dampak Besar.</h2>
            <p>
              Setiap laporan yang Anda baca dan bagikan dapat membantu barang berharga menemukan jalan pulang kepada pemiliknya di UNKLAB.
            </p>
          </div>
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
            <p className="sq-copyright">
              © 2026 Lost and Found UNKLAB · Menemukan jalan pulang.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
