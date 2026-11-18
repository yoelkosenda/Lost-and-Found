import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { Link, navigate } from '../router.jsx'
import ClaimAction from '../components/claims/ClaimAction.jsx'
import AppNavbar from '../components/layout/AppNavbar.jsx'
import GoogleMapPin from '../components/maps/GoogleMapPin.jsx'
import { CAMPUS_CENTER, CAMPUS_LOCATION_NAMES, getCoordinatesForReport } from '../lib/campusLocations.js'

const REPORT_CATEGORIES = [
  'Elektronik',
  'Aksesori',
  'Kunci',
  'Dokumen/Buku',
  'Perlengkapan',
  'Pakaian',
  'Lainnya',
]

const REPORT_STATUSES = [
  'Masih dicari',
  'Menunggu pemilik',
  'Sedang diklaim',
  'Dalam verifikasi',
  'Sudah ditemukan',
  'Sudah dikembalikan',
  'Dibatalkan / Ditutup',
]

function parseDashboardSearch(search) {
  try {
    const params = new URLSearchParams(search || window.location.search)
    const q = params.get('q') || ''
    const rawType = params.get('type') || ''
    const type =
      rawType.toLowerCase() === 'lost'
        ? 'Lost'
        : rawType.toLowerCase() === 'found'
          ? 'Found'
          : 'Semua'
    return { q, type }
  } catch {
    return { q: '', type: 'Semua' }
  }
}

export default function DashboardPage({ user, onLogout, search }) {
  const initialParams = parseDashboardSearch(search)
  const [data, setData] = useState(null)
  const [claims, setClaims] = useState([])
  const [activityData, setActivityData] = useState(null)
  const [activityError, setActivityError] = useState('')
  const [query, setQuery] = useState(initialParams.q)
  const [type, setType] = useState(initialParams.type)
  const [category, setCategory] = useState('Semua')
  const [location, setLocation] = useState('Semua')
  const [dateRange, setDateRange] = useState('Semua')
  const [statusFilter, setStatusFilter] = useState('Semua')
  const [error, setError] = useState('')

  useEffect(() => {
    const next = parseDashboardSearch(search)
    setQuery(next.q)
    if (next.type !== 'Semua') setType(next.type)
  }, [search])

  const hasActiveFilters =
    query.trim() !== '' ||
    type !== 'Semua' ||
    category !== 'Semua' ||
    location !== 'Semua' ||
    dateRange !== 'Semua' ||
    statusFilter !== 'Semua'

  const resetFilters = () => {
    setQuery('')
    setType('Semua')
    setCategory('Semua')
    setLocation('Semua')
    setDateRange('Semua')
    setStatusFilter('Semua')
    if (window.location.search) navigate('/app')
  }

  const load = () => {
    setError('')
    setActivityError('')
    api.reports().then(setData).catch((e) => setError(e.message))
    // Riwayat klaim hanya dipakai untuk menandai kartu; kegagalannya tidak boleh menutupi daftar laporan.
    api.myClaims().then(({ claims }) => setClaims(claims)).catch(() => {})
    api
      .activities()
      .then(setActivityData)
      .catch((e) => setActivityError(e.message))
  }

  useEffect(load, [])

  // Status klaim terbaru user per laporan (daftar klaim sudah terurut dari yang terbaru).
  const claimStatusByReport = useMemo(() => {
    const map = new Map()
    for (const c of claims) if (!map.has(c.report_id)) map.set(c.report_id, c.status)
    return map
  }, [claims])

  const reports = useMemo(() => {
    const now = new Date()
    const startOf7DaysAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6,
    ).getTime()

    return (data?.reports ?? []).filter((r) => {
      if (type !== 'Semua' && r.type !== type) return false
      if (category !== 'Semua' && r.category !== category) return false
      if (location !== 'Semua' && r.location !== location) return false
      if (
        statusFilter !== 'Semua' &&
        (r.status || '').toLowerCase() !== statusFilter.toLowerCase()
      ) {
        return false
      }
      if (dateRange !== 'Semua') {
        const reportedDate = new Date(r.reported_at)
        if (Number.isNaN(reportedDate.getTime())) return false
        if (dateRange === 'today') {
          const isToday =
            reportedDate.getFullYear() === now.getFullYear() &&
            reportedDate.getMonth() === now.getMonth() &&
            reportedDate.getDate() === now.getDate()
          if (!isToday) return false
        } else if (dateRange === '7days') {
          if (reportedDate.getTime() < startOf7DaysAgo) return false
        }
      }
      if (
        query.trim() &&
        !`${r.title} ${r.category} ${r.color ?? ''} ${r.location} ${r.description ?? ''}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [data, query, type, category, location, dateRange, statusFilter])

  const found = data?.reports.filter((r) => r.type === 'Found').length ?? 0
  const lost = data?.reports.filter((r) => r.type === 'Lost').length ?? 0
  const returnedCount =
    data?.reports.filter(
      (r) => r.status === 'Sudah dikembalikan' || r.status === 'Sudah ditemukan',
    ).length ?? 0
  const total = data?.reports.length ?? '—'

  return (
    <div className="sq-page">
      <AppNavbar user={user} onLogout={onLogout} active="dashboard" />

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
                <Link to="/app/reports/new?type=Lost" className="sq-btn sq-btn-outline">
                  + Lapor Barang Hilang
                </Link>
                <Link to="/app/reports/new?type=Found" className="sq-btn sq-btn-lime">
                  + Lapor Barang Temuan
                </Link>
                <Link to="/app/matching" className="sq-btn sq-btn-outline">
                  Smart Matching ↗
                </Link>
              </div>
            </div>

            <div className="sq-dash-highlight">
              <div className="sq-icon-badge">
                <img src="/figma/icon-why-1.svg" alt="" width="40" height="40" />
              </div>
              <p>Barang ditemukan minggu ini</p>
              <strong>{found}</strong>
              <small>
                {returnedCount > 0
                  ? `${returnedCount} laporan telah kembali ke pemiliknya`
                  : 'Laporan aktif dari komunitas mahasiswa'}
              </small>
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
                  placeholder="Cari barang, warna, kategori, atau lokasi..."
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

          <div className="sq-advanced-filters" aria-label="Filter lanjutan laporan">
            <div className="sq-advanced-filters-grid">
              <label className="sq-filter-group">
                <span className="sq-filter-label">Kategori</span>
                <select
                  className="sq-select-field"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Filter kategori"
                >
                  <option value="Semua">Semua Kategori</option>
                  {REPORT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <label className="sq-filter-group">
                <span className="sq-filter-label">Lokasi Kampus</span>
                <select
                  className="sq-select-field"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  aria-label="Filter lokasi kampus"
                >
                  <option value="Semua">Semua Lokasi</option>
                  {CAMPUS_LOCATION_NAMES.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </label>

              <label className="sq-filter-group">
                <span className="sq-filter-label">Rentang Tanggal</span>
                <select
                  className="sq-select-field"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  aria-label="Filter rentang tanggal"
                >
                  <option value="Semua">Semua Waktu</option>
                  <option value="today">Hari ini</option>
                  <option value="7days">7 hari terakhir</option>
                </select>
              </label>

              <label className="sq-filter-group">
                <span className="sq-filter-label">Status</span>
                <select
                  className="sq-select-field"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter status laporan"
                >
                  <option value="Semua">Semua Status</option>
                  {REPORT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="sq-filter-summary-row">
              <p className="sq-filter-count" aria-live="polite">
                {data ? (
                  <>
                    <strong>{reports.length}</strong> laporan ditemukan
                  </>
                ) : (
                  'Memuat laporan…'
                )}
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="sq-btn sq-btn-outline sq-reset-filter-btn"
                  onClick={resetFilters}
                >
                  Reset Filter ✕
                </button>
              )}
            </div>
          </div>

          {reports.length > 0 && (
            <div className="sq-dash-map-wrap">
              <GoogleMapPin
                lat={CAMPUS_CENTER.lat}
                lng={CAMPUS_CENTER.lng}
                zoom={16}
                height={260}
                title="Peta Lokasi Barang Hilang & Ditemukan UNKLAB"
                markers={reports.map((r) => {
                  const c = getCoordinatesForReport(r)
                  return {
                    id: r.id,
                    lat: c.lat,
                    lng: c.lng,
                    title: r.title,
                    subtitle: `${r.type === 'Lost' ? 'Hilang' : 'Ditemukan'} · ${r.location}`,
                    type: r.type,
                  }
                })}
                onMarkerClick={(item) => navigate(`/app/reports/${item.id}`)}
              />
            </div>
          )}

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
                <article
                  className={`sq-report-card ${r.type.toLowerCase()}`}
                  key={r.id}
                  onClick={() => navigate(`/app/reports/${r.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/app/reports/${r.id}`)
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  aria-label={`Lihat detail ${r.title}`}
                >
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
                    <div className="sq-work-pill">
                      Warna: {r.color || 'Belum dicantumkan'}
                    </div>

                    {r.description && <p className="sq-report-desc">{r.description}</p>}

                    <ClaimAction
                      report={r}
                      user={user}
                      existingStatus={claimStatusByReport.get(r.id)}
                      onClaimed={load}
                    />

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
            <div className="sq-state sq-empty-state">
              <b>Tidak ada laporan yang sesuai dengan filter Anda.</b>
              <p>Coba ubah kata kunci pencarian, kategori, lokasi, rentang tanggal, atau status laporan.</p>
              {hasActiveFilters && (
                <button type="button" className="sq-btn sq-btn-lime" onClick={resetFilters}>
                  Reset Filter
                </button>
              )}
            </div>
          )}
        </section>

        {/* ACTIVITY FEED SECTION */}
        <section id="aktivitas" className="sq-section">
          <div className="sq-dash-toolbar">
            <div>
              <span className="sq-kicker-pill">AKTIVITAS KOMUNITAS</span>
              <h2>Jejak Laporan & Klaim Terbaru</h2>
            </div>
            <p className="sq-activity-sub">
              Pantauan real-time laporan barang dan pengajuan klaim di lingkungan kampus UNKLAB.
            </p>
          </div>

          {activityError ? (
            <div className="sq-state error">
              <b>{activityError}</b>
              <button type="button" className="sq-btn sq-btn-lime" onClick={load}>
                Muat ulang aktivitas
              </button>
            </div>
          ) : !activityData ? (
            <div className="sq-state">Memuat aktivitas komunitas…</div>
          ) : activityData.activities?.length ? (
            <div className="sq-activity-grid">
              {activityData.activities.map((act) => {
                const isClaim = act.activity_type === 'claim'
                const isFound = act.item_type === 'Found'
                const badgeClass = isClaim ? 'claim' : isFound ? 'found' : 'lost'
                const iconSrc = isClaim
                  ? '/figma/icon-service-3.svg'
                  : isFound
                    ? '/figma/icon-service-2.svg'
                    : '/figma/icon-service-1.svg'
                const activityTitle = isClaim
                  ? `Pengajuan klaim baru untuk: ${act.title}`
                  : isFound
                    ? `Laporan Barang Ditemukan baru: ${act.title} di ${act.location}`
                    : `Laporan Barang Hilang baru: ${act.title} di ${act.location}`
                const statusLabel =
                  act.status === 'pending'
                    ? 'Dalam verifikasi'
                    : act.status === 'approved' || act.status === 'accepted'
                      ? 'Tahap serah terima'
                      : act.status === 'completed'
                        ? 'Sudah dikembalikan'
                        : act.status === 'rejected'
                          ? 'Klaim ditolak'
                          : act.status

                return (
                  <article
                    className={`sq-activity-card ${badgeClass}`}
                    key={`${act.activity_type}-${act.id}`}
                  >
                    <div className="sq-activity-top">
                      <div className="sq-icon-badge sm">
                        <img src={iconSrc} alt="" width="28" height="28" />
                      </div>
                      <div className="sq-activity-badges">
                        <span className="sq-activity-type-tag">
                          {isClaim
                            ? 'KLAIM BARANG'
                            : isFound
                              ? 'LAPORAN TEMUAN'
                              : 'LAPORAN KEHILANGAN'}
                        </span>
                        <em className={`sq-status-badge ${badgeClass}`}>{statusLabel}</em>
                      </div>
                    </div>

                    <h3 className="sq-activity-title">{activityTitle}</h3>

                    <div className="sq-activity-footer">
                      <span className="sq-work-pill">Lokasi · {act.location}</span>
                      <time className="sq-activity-time" dateTime={act.created_at}>
                        {new Date(act.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="sq-state">Belum ada aktivitas komunitas terbaru.</div>
          )}
        </section>

        {/* COMMUNITY FOOTER BANNER */}
        <section className="sq-cta-banner">
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
