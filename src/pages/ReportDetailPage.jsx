import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.js'
import { showToast } from '../lib/toast.js'
import { Link, navigate } from '../router.jsx'
import ClaimAction from '../components/claims/ClaimAction.jsx'
import AppNavbar from '../components/layout/AppNavbar.jsx'
import GoogleMapPin from '../components/maps/GoogleMapPin.jsx'
import StatusHistory from '../components/reports/StatusHistory.jsx'
import ReportImagePreview from '../components/reports/ReportImagePreview.jsx'
import { getCoordinatesForReport } from '../lib/campusLocations.js'

const FLAG_REASONS = [
  'Foto tidak pantas',
  'Laporan ganda / spam',
  'Memuat nomor identitas atau data pribadi utuh',
  'Informasi tidak akurat / menyesatkan',
  'Lainnya',
]

export default function ReportDetailPage({ id, user, onLogout }) {
  const [report, setReport] = useState(null)
  const [claims, setClaims] = useState([])
  const [error, setError] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [flagOpen, setFlagOpen] = useState(false)
  const [historyRefresh, setHistoryRefresh] = useState(0)

  const load = () => {
    setError('')
    api
      .report(id)
      .then(({ report: result }) => {
        setReport(result)
      })
      .catch((reason) => {
        setError(reason.message)
      })
    api
      .myClaims()
      .then(({ claims: list }) => setClaims(list))
      .catch(() => {})
  }

  useEffect(() => {
    setReport(null)
    load()
  }, [id])

  const existingStatus = claims.find((c) => String(c.report_id) === String(id))?.status

  const date =
    report &&
    new Date(report.reported_at).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  const estimatedTime =
    report &&
    new Date(report.reported_at).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="sq-page">
      <AppNavbar user={user} onLogout={onLogout} active="dashboard" />

      <main className="sq-container sq-detail-container">
        <Link to="/app" className="sq-btn sq-btn-outline sq-detail-back">
          ← Kembali ke Dashboard
        </Link>
        {error ? (
          <section className="sq-state error" role="alert">
            <b>{error === 'Laporan tidak ditemukan.' ? 'Laporan tidak ditemukan.' : error}</b>
            <button
              type="button"
              className="sq-btn sq-btn-lime"
              onClick={() => navigate('/app')}
            >
              Kembali ke Dashboard
            </button>
          </section>
        ) : !report ? (
          <section className="sq-state sq-detail-loading" role="status" aria-live="polite">
            Memuat detail laporan…
          </section>
        ) : (
          <article className="sq-detail-layout">
            <section className="sq-section sq-detail-main">
              <div className="sq-detail-heading">
                <div className="sq-detail-kicker-row">
                  <span className="sq-report-type-label">
                    {report.type === 'Lost' ? 'BARANG HILANG' : 'BARANG DITEMUKAN'}
                  </span>
                  <em className={`sq-status-badge ${report.type.toLowerCase()}`}>
                    {report.status}
                  </em>
                </div>
                <h1>{report.title}</h1>
                <p className="sq-detail-intro">
                  Informasi laporan barang di lingkungan kampus UNKLAB.
                </p>
              </div>

              <div className={`sq-work-visual ${report.type.toLowerCase()} sq-detail-visual`}>
                {report.image_url ? (
                  <button
                    type="button"
                    className="sq-detail-image-button"
                    onClick={() => setPreviewOpen(true)}
                    aria-label={`Perbesar foto ${report.title}`}
                  >
                    <img src={report.image_url} alt={`Foto ${report.title}`} />
                  </button>
                ) : (
                  <>
                    <div className="sq-visual-grid" aria-hidden="true" />
                    <div className="sq-visual-center">
                      <span className="sq-visual-orb" aria-hidden="true">
                        {report.type === 'Found' ? '✓' : '?'}
                      </span>
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

              <section className="sq-detail-description">
                <h2>Titik Lokasi di Peta</h2>
                <p className="sq-map-caption">
                  Perkiraan titik {report.type === 'Lost' ? 'kehilangan' : 'penemuan'} barang di
                  area <strong>{report.location}</strong>, Kampus UNKLAB.
                </p>
                {(() => {
                  const coords = getCoordinatesForReport(report)
                  return (
                    <GoogleMapPin
                      lat={coords.lat}
                      lng={coords.lng}
                      title={report.title}
                      subtitle={`${report.type === 'Lost' ? 'Hilang' : 'Ditemukan'} di ${report.location}`}
                      type={report.type}
                      height={260}
                    />
                  )
                })()}
              </section>

              <section className="sq-detail-description">
                <h2>Riwayat Status (Timeline)</h2>
                <StatusHistory
                  reportId={report.id}
                  currentStatus={report.status}
                  reportedAt={report.reported_at}
                  refreshKey={historyRefresh}
                />
              </section>
            </section>

            <aside className="sq-detail-side">
              <section className="sq-section sq-detail-info">
                <span className="sq-kicker-pill">RINGKASAN LAPORAN</span>
                <dl className="sq-detail-metadata">
                  <div>
                    <dt>Kategori</dt>
                    <dd>{report.category}</dd>
                  </div>
                  <div>
                    <dt>Warna barang</dt>
                    <dd>{report.color || 'Tidak dicantumkan'}</dd>
                  </div>
                  <div>
                    <dt>
                      {report.type === 'Lost' ? 'Terakhir terlihat di' : 'Ditemukan di'}
                    </dt>
                    <dd>{report.location}</dd>
                  </div>
                  <div>
                    <dt>Perkiraan jam kejadian</dt>
                    <dd>{estimatedTime}</dd>
                  </div>
                  <div>
                    <dt>Waktu dilaporkan</dt>
                    <dd>
                      <time dateTime={report.reported_at}>{date}</time>
                    </dd>
                  </div>
                  <div>
                    <dt>Dilaporkan oleh</dt>
                    <dd>
                      {report.owner_name}
                      <small>Mahasiswa UNKLAB</small>
                    </dd>
                  </div>
                </dl>
                <p className="sq-privacy-note">
                  🔒 Nomor telepon pelapor bersifat privat. Kontak hanya dibagikan jika kedua pihak setuju di ruang klaim.
                </p>
                <button
                  type="button"
                  className="sq-btn sq-btn-outline"
                  style={{ width: '100%', marginTop: '14px' }}
                  onClick={async () => {
                    const shareUrl = window.location.href
                    try {
                      if (navigator.clipboard?.writeText) {
                        await navigator.clipboard.writeText(shareUrl)
                        showToast('Tautan laporan berhasil disalin ke clipboard!', 'success')
                      } else {
                        window.prompt('Salin tautan laporan ini:', shareUrl)
                      }
                    } catch {
                      window.prompt('Salin tautan laporan ini:', shareUrl)
                    }
                  }}
                >
                  🔗 Salin Tautan Laporan
                </button>
              </section>

              {report.type === 'Found' ? (
                <section className="sq-detail-action-card">
                  <span className="sq-kicker-pill">BARANG TEMUAN</span>
                  <h2>Merasa ini milik Anda?</h2>
                  <p>
                    Ajukan klaim dengan menjelaskan ciri barang yang tidak dipublikasikan pada
                    laporan.
                  </p>
                  {report.owner_id === user.id ? (
                    <div className="sq-detail-owner-actions">
                      <p className="sq-detail-claim-note" role="status">
                        Ini adalah laporan barang temuan yang Anda buat sendiri.
                      </p>
                      <Link to="/app/my-reports" className="sq-btn sq-btn-outline">
                        Kelola di Laporan Saya
                      </Link>
                    </div>
                  ) : (
                    <ClaimAction
                      report={report}
                      user={user}
                      existingStatus={existingStatus}
                      onClaimed={() => {
                        load()
                        setHistoryRefresh((v) => v + 1)
                      }}
                    />
                  )}
                </section>
              ) : (
                <section className="sq-detail-action-card">
                  <span className="sq-kicker-pill">PANDUAN PENGEMBALIAN</span>
                  <h2>Menemukan barang ini?</h2>
                  <p>
                    Buat laporan barang temuan agar Smart Matching otomatis memberi tahu pelapor, atau serahkan ke loket keamanan terdekat di kampus.
                  </p>
                  <div className="sq-hero-actions" style={{ marginTop: '12px' }}>
                    <Link to="/app/reports/new?type=Found" className="sq-btn sq-btn-lime">
                      + Lapor Barang Temuan
                    </Link>
                    <Link to="/app" className="sq-btn sq-btn-outline">
                      Kembali ke laporan
                    </Link>
                  </div>
                </section>
              )}

              {report.owner_id !== user.id && (
                <section className="sq-detail-action-card sq-flag-card">
                  <span className="sq-kicker-pill">MODERASI KOMUNITAS</span>
                  <h2>Aduan Penyalahgunaan</h2>
                  <p>
                    Temukan foto tidak pantas, data identitas utuh, atau laporan ganda? Laporkan agar komunitas tetap aman.
                  </p>
                  {report.my_flag_reason ? (
                    <p className="sq-detail-claim-note" role="status">
                      ✓ Anda telah melaporkan kiriman ini ({report.my_flag_reason}).
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="sq-btn sq-btn-outline sq-btn-danger"
                    onClick={() => setFlagOpen(true)}
                  >
                    {report.my_flag_reason ? 'Perbarui Aduan Laporan' : 'Laporkan Penyalahgunaan'}
                  </button>
                </section>
              )}
            </aside>
          </article>
        )}
      </main>
      {previewOpen && report?.image_url && (
        <ReportImagePreview
          imageUrl={report.image_url}
          title={report.title}
          onClose={() => setPreviewOpen(false)}
        />
      )}
      {flagOpen && report && (
        <FlagReportDialog
          report={report}
          initialReason={report.my_flag_reason || FLAG_REASONS[0]}
          onClose={() => setFlagOpen(false)}
          onFlagged={(res) => {
            setFlagOpen(false)
            load()
            setHistoryRefresh((v) => v + 1)
            if (res?.auto_closed) {
              showToast(
                'Laporan menerima 3+ aduan komunitas dan telah ditutup otomatis.',
                'warning',
              )
            } else {
              showToast('Aduan penyalahgunaan berhasil dikirim dan dicatat.', 'success')
            }
          }}
        />
      )}
    </div>
  )
}

function FlagReportDialog({ report, initialReason, onClose, onFlagged }) {
  const dialogRef = useRef(null)
  const [reason, setReason] = useState(
    FLAG_REASONS.includes(initialReason) ? initialReason : FLAG_REASONS[0],
  )
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      if (dialog?.open) dialog.close()
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    const finalReason = reason === 'Lainnya' ? note.trim() || 'Lainnya' : reason
    if (finalReason.length < 3) {
      setError('Pilih atau tuliskan alasan aduan.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await api.flagReport(report.id, finalReason, note.trim())
      onFlagged(res)
    } catch (err) {
      setError(err.message || 'Gagal mengirim aduan.')
      setSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="sq-claim-dialog"
      aria-labelledby="flag-report-title"
      onCancel={(e) => {
        e.preventDefault()
        if (!submitting) onClose()
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current && !submitting) onClose()
      }}
    >
      <form className="sq-form-box sq-claim-box" onSubmit={submit} noValidate>
        <div className="sq-claim-head">
          <span className="sq-kicker-pill">ADUAN KOMUNITAS · #LF-{report.id}</span>
          <h2 id="flag-report-title">Laporkan Penyalahgunaan</h2>
          <p className="sq-claim-item">
            {report.title} · {report.location}
          </p>
        </div>

        <p className="sq-claim-privacy">
          Laporan yang menerima 3 atau lebih aduan valid dari mahasiswa berbeda akan otomatis ditutup oleh moderasi komunitas.
        </p>

        {error && (
          <div className="sq-form-error" role="alert">
            {error}
          </div>
        )}

        <label className="sq-input-card">
          <span className="sq-input-label">Alasan Aduan</span>
          <div className="sq-input-underline">
            <select
              className="sq-form-select"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError('')
              }}
            >
              {FLAG_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="sq-input-card">
          <span className="sq-input-label">Keterangan Tambahan (opsional)</span>
          <div className="sq-input-underline">
            <textarea
              rows={3}
              maxLength={400}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Jelaskan secara singkat bagian yang melanggar ketentuan komunitas…"
            />
          </div>
        </label>

        <div className="sq-claim-actions">
          <button
            type="button"
            className="sq-btn sq-btn-outline"
            onClick={onClose}
            disabled={submitting}
          >
            Batal
          </button>
          <button type="submit" className="sq-btn sq-btn-lime" disabled={submitting}>
            {submitting ? 'Mengirim…' : 'Kirim Aduan'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
