import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { Link, navigate } from '../router.jsx'

export default function ReportDetailPage({ id, user, onLogout }) {
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [claimInfo, setClaimInfo] = useState(false)

  useEffect(() => {
    let active = true
    setReport(null)
    setError('')
    api.report(id).then(({ report: result }) => {
      if (active) setReport(result)
    }).catch((reason) => {
      if (active) setError(reason.message)
    })
    return () => { active = false }
  }, [id])

  const initials = user.name.split(' ').map((part) => part[0]).join('')
  const date = report && new Date(report.reported_at).toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="sq-page">
      <header className="sq-navbar">
        <div className="sq-navbar-inner">
          <Link to="/app" className="sq-brand" aria-label="Dashboard Lost and Found UNKLAB">
            <span className="sq-brand-box"><img src="/figma/logo-cube.svg" alt="" width="38" height="43" /></span>
            <span className="sq-brand-text">Lost and Found<span>.</span><small>UNKLAB</small></span>
          </Link>
          <nav className="sq-nav-links" aria-label="Navigasi utama">
            <Link to="/app" className="sq-nav-item active">Dashboard</Link>
          </nav>
          <div className="sq-account-bar">
            <div className="sq-user-chip"><span className="sq-avatar">{initials}</span><div className="sq-user-meta"><b>{user.name}</b><small>Mahasiswa</small></div></div>
            <button type="button" className="sq-btn sq-btn-outline sq-logout-btn" onClick={onLogout}>Keluar</button>
          </div>
        </div>
      </header>

      <main className="sq-container sq-detail-container">
        <Link to="/app" className="sq-btn sq-btn-outline sq-detail-back">← Kembali ke Dashboard</Link>
        {error ? (
          <section className="sq-state error" role="alert">
            <b>{error === 'Laporan tidak ditemukan.' ? 'Laporan tidak ditemukan.' : error}</b>
            <button type="button" className="sq-btn sq-btn-lime" onClick={() => navigate('/app')}>Kembali ke Dashboard</button>
          </section>
        ) : !report ? (
          <section className="sq-state sq-detail-loading" role="status" aria-live="polite">Memuat detail laporan…</section>
        ) : (
          <article className="sq-detail-layout">
            <section className="sq-section sq-detail-main">
              <div className="sq-detail-heading">
                <div className="sq-detail-kicker-row">
                  <span className="sq-report-type-label">{report.type === 'Lost' ? 'BARANG HILANG' : 'BARANG DITEMUKAN'}</span>
                  <em className={`sq-status-badge ${report.type.toLowerCase()}`}>{report.status}</em>
                </div>
                <h1>{report.title}</h1>
                <p className="sq-detail-intro">Informasi laporan barang di lingkungan kampus UNKLAB.</p>
              </div>

              <div className={`sq-work-visual ${report.type.toLowerCase()} sq-detail-visual`}>
                {report.image_url ? <img src={report.image_url} alt={`Foto ${report.title}`} /> : (
                  <>
                    <div className="sq-visual-grid" aria-hidden="true" />
                    <div className="sq-visual-center">
                      <span className="sq-visual-orb" aria-hidden="true">{report.type === 'Found' ? '✓' : '?'}</span>
                      <strong>{report.title}</strong>
                      <small>{report.category}</small>
                    </div>
                    <span className="sq-work-pill">Visual barang belum tersedia</span>
                  </>
                )}
              </div>

              <section className="sq-detail-description">
                <h2>Deskripsi barang</h2>
                <p>{report.description || 'Belum ada deskripsi tambahan untuk laporan ini.'}</p>
              </section>
            </section>

            <aside className="sq-detail-side">
              <section className="sq-section sq-detail-info">
                <span className="sq-kicker-pill">RINGKASAN LAPORAN</span>
                <dl className="sq-detail-metadata">
                  <div><dt>Kategori</dt><dd>{report.category}</dd></div>
                  <div><dt>Lokasi kampus</dt><dd>{report.location}</dd></div>
                  <div><dt>Waktu dilaporkan</dt><dd><time dateTime={report.reported_at}>{date}</time></dd></div>
                  <div><dt>Dilaporkan oleh</dt><dd>{report.owner_name}<small>Mahasiswa</small></dd></div>
                </dl>
              </section>

              {report.type === 'Found' ? (
                <section className="sq-detail-action-card">
                  <span className="sq-kicker-pill">BARANG TEMUAN</span>
                  <h2>Merasa ini milik Anda?</h2>
                  <p>Ajukan klaim dengan menjelaskan ciri barang yang tidak dipublikasikan pada laporan.</p>
                  <button type="button" className="sq-btn sq-btn-lime" onClick={() => setClaimInfo(true)}>Ajukan Klaim Barang Ini</button>
                  {claimInfo && <p className="sq-detail-claim-note" role="status">Pengajuan klaim untuk barang ini akan diproses melalui koordinasi kampus. Siapkan bukti kepemilikan untuk verifikasi.</p>}
                </section>
              ) : (
                <section className="sq-detail-action-card">
                  <span className="sq-kicker-pill">PANDUAN PENGEMBALIAN</span>
                  <h2>Menemukan barang ini?</h2>
                  <p>Serahkan barang ke loket keamanan terdekat di kampus agar dapat dikoordinasikan dengan pelapor.</p>
                  <Link to="/app" className="sq-btn sq-btn-outline">Kembali ke laporan</Link>
                </section>
              )}
            </aside>
          </article>
        )}
      </main>
    </div>
  )
}
