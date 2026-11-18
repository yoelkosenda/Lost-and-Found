import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api.js'
import { showToast } from '../lib/toast.js'
import { Link } from '../router.jsx'
import AppNavbar from '../components/layout/AppNavbar.jsx'
import StatusHistory from '../components/reports/StatusHistory.jsx'
import ReportEditModal from '../components/reports/ReportEditModal.jsx'

const CLOSE_REASON_OPTIONS = [
  'Barang sudah ditemukan sendiri',
  'Salah membuat laporan / laporan ganda',
  'Sudah diserahkan ke Pos Keamanan UNKLAB',
  'Masa pencarian semester berakhir',
  'Lainnya',
]

export default function MyReportsPage({ user, onLogout }) {
  const [reports, setReports] = useState([])
  const [incomingClaims, setIncomingClaims] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('Semua')
  const [updatingId, setUpdatingId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [openHistory, setOpenHistory] = useState({})
  const [historyRefresh, setHistoryRefresh] = useState(0)
  const [editingReport, setEditingReport] = useState(null)
  const [closingReport, setClosingReport] = useState(null)
  const [deletingReport, setDeletingReport] = useState(null)

  const toggleHistory = (reportId) => {
    setOpenHistory((prev) => ({ ...prev, [reportId]: !prev[reportId] }))
  }

  const loadReports = () => {
    setLoading(true)
    setError('')
    api
      .myReports()
      .then((data) => {
        const rows = data?.reports ?? []
        setReports(rows)
        Promise.all(
          rows
            .filter((r) => r.type === 'Found')
            .map(async (r) => {
              try {
                const result = await api.reportClaims(r.id)
                return [r.id, result?.claims ?? []]
              } catch {
                return [r.id, []]
              }
            }),
        ).then((entries) => setIncomingClaims(Object.fromEntries(entries)))
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

  const applyStatusUpdate = async (id, newStatus, reason = '') => {
    setUpdatingId(id)
    setFeedback(null)
    try {
      const result = await api.updateReportStatus(id, newStatus, reason)
      const updated = result?.report
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: updated?.status || newStatus } : r)),
      )
      setHistoryRefresh((v) => v + 1)
      const msg = reason
        ? `Status diubah menjadi "${newStatus}" dan alasan tercatat di riwayat.`
        : `Status laporan berhasil diubah menjadi "${newStatus}".`
      setFeedback({ type: 'success', message: msg })
      showToast(msg, 'success')
    } catch (err) {
      const errMsg = err.message || 'Gagal memperbarui status laporan.'
      setFeedback({ type: 'error', message: errMsg })
      showToast(errMsg, 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleQuickResolve = async (r) => {
    const targetStatus = r.type === 'Lost' ? 'Sudah ditemukan' : 'Sudah dikembalikan'
    await applyStatusUpdate(
      r.id,
      targetStatus,
      r.type === 'Lost'
        ? 'Pemilik mengonfirmasi barang telah ditemukan kembali'
        : 'Penemu mengonfirmasi barang telah diserahkan kepada pemilik sah',
    )
  }

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchType = type === 'Semua' || r.type === type
      const matchQuery = `${r.title} ${r.category} ${r.color ?? ''} ${r.location} ${r.description ?? ''}`
        .toLowerCase()
        .includes(query.toLowerCase())
      return matchType && matchQuery
    })
  }, [reports, type, query])

  // Statistics
  const totalCount = reports.length
  const completedCount = reports.filter(
    (r) => r.status === 'Sudah ditemukan' || r.status === 'Sudah dikembalikan',
  ).length
  const activeCount = reports.filter(
    (r) =>
      r.status !== 'Sudah ditemukan' &&
      r.status !== 'Sudah dikembalikan' &&
      r.status !== 'Dibatalkan / Ditutup',
  ).length

  const lostCount = reports.filter((r) => r.type === 'Lost').length
  const foundCount = reports.filter((r) => r.type === 'Found').length

  return (
    <div className="sq-page">
      <AppNavbar user={user} onLogout={onLogout} active="my-reports" />

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
                kembali ke pemiliknya atau tutup laporan beserta alasannya agar riwayat tetap jelas.
              </p>
              <div className="sq-hero-actions">
                <Link to="/app/reports/new?type=Lost" className="sq-btn sq-btn-outline">
                  + Lapor Barang Hilang
                </Link>
                <Link to="/app/reports/new?type=Found" className="sq-btn sq-btn-lime">
                  + Lapor Barang Temuan
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
                const statusChoices =
                  r.type === 'Lost'
                    ? ['Masih dicari', 'Dalam verifikasi', 'Sudah ditemukan']
                    : ['Menunggu pemilik', 'Sedang diklaim', 'Dalam verifikasi', 'Sudah dikembalikan']

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
                        <span className="sq-status-badge pending">
                          {incomingClaims[r.id].length} klaim masuk
                        </span>
                        <div className="sq-incoming-claim-links">
                          {incomingClaims[r.id].map((claim) => (
                            <Link
                              key={claim.id}
                              to={`/app/claims/${claim.id}`}
                              className="sq-incoming-claim-link"
                            >
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

                      <h3>
                        <Link to={`/app/reports/${r.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {r.title}
                        </Link>
                      </h3>

                      <div className="sq-work-pill">
                        {r.category} · {r.location}
                      </div>
                      <div className="sq-work-pill">Warna: {r.color || 'Belum dicantumkan'}</div>

                      {r.description && <p className="sq-report-desc">{r.description}</p>}

                      <div className="sq-report-footer">
                        <span className="sq-status-text">
                          Status: <b>{r.status}</b>
                        </span>
                        <select
                          className="sq-select-field sq-status-quick-select"
                          aria-label={`Ubah status ${r.title}`}
                          value={statusChoices.includes(r.status) ? r.status : ''}
                          disabled={isBusy}
                          onChange={(e) => {
                            const nextStatus = e.target.value
                            if (!nextStatus || nextStatus === r.status) return
                            applyStatusUpdate(r.id, nextStatus, `Diperbarui oleh pelapor ke "${nextStatus}"`)
                          }}
                        >
                          <option value="" disabled>
                            Ubah status…
                          </option>
                          {statusChoices.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
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
                          onClick={() => handleQuickResolve(r)}
                          title={
                            isResolved
                              ? `Laporan sudah ditandai ${resolvedTargetStatus}`
                              : `Tandai laporan menjadi ${resolvedTargetStatus}`
                          }
                        >
                          {isBusy
                            ? 'Memproses…'
                            : isResolved
                              ? `✓ ${resolvedTargetStatus}`
                              : resolvedTargetStatus}
                        </button>

                        <button
                          type="button"
                          className="sq-btn sq-btn-outline sq-btn-danger"
                          style={{
                            padding: '9px 18px',
                            fontSize: '13px',
                            opacity: isClosed ? 0.6 : 1,
                            cursor: isClosed || isBusy ? 'not-allowed' : 'pointer',
                          }}
                          disabled={isClosed || isBusy}
                          onClick={() => setClosingReport(r)}
                          title={
                            isClosed
                              ? 'Laporan sudah dibatalkan atau ditutup'
                              : 'Tutup atau batalkan laporan ini dengan alasan'
                          }
                        >
                          {isClosed ? '✓ Dibatalkan / Ditutup' : 'Tutup / Batalkan'}
                        </button>

                        <button
                          type="button"
                          className="sq-btn sq-btn-outline"
                          disabled={isBusy}
                          onClick={() => setEditingReport(r)}
                        >
                          Edit Laporan
                        </button>

                        <button
                          type="button"
                          className="sq-btn sq-btn-outline sq-history-toggle"
                          aria-expanded={Boolean(openHistory[r.id])}
                          onClick={() => toggleHistory(r.id)}
                        >
                          {openHistory[r.id] ? 'Tutup Riwayat ▲' : 'Riwayat Status ▼'}
                        </button>

                        <button
                          type="button"
                          className="sq-btn sq-btn-outline sq-btn-danger"
                          style={{ padding: '9px 14px', fontSize: '13px' }}
                          disabled={isBusy}
                          onClick={() => setDeletingReport(r)}
                          title="Hapus laporan ini dari daftar"
                        >
                          Hapus
                        </button>
                      </div>

                      {openHistory[r.id] && (
                        <div className="sq-myreport-history">
                          <h4 className="sq-myreport-history-title">Riwayat Status (Timeline)</h4>
                          <StatusHistory
                            reportId={r.id}
                            currentStatus={r.status}
                            reportedAt={r.reported_at}
                            refreshKey={historyRefresh}
                            compact
                          />
                        </div>
                      )}
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
            <p className="sq-copyright">© 2026 Lost and Found UNKLAB · Menemukan jalan pulang.</p>
          </div>
        </div>
      </footer>

      {editingReport && (
        <ReportEditModal
          report={editingReport}
          userId={user?.id}
          onClose={() => setEditingReport(null)}
          onSaved={(updatedReport) => {
            setReports((prev) =>
              prev.map((report) =>
                String(report.id) === String(updatedReport.id)
                  ? { ...report, ...updatedReport }
                  : report,
              ),
            )
            setEditingReport(null)
            setFeedback({ type: 'success', message: 'Detail laporan berhasil diperbarui.' })
            showToast('Detail laporan berhasil diperbarui.', 'success')
          }}
        />
      )}

      {closingReport && (
        <CloseReportDialog
          report={closingReport}
          busy={updatingId === closingReport.id}
          onClose={() => setClosingReport(null)}
          onConfirm={async (reasonText) => {
            const target = closingReport
            setClosingReport(null)
            setOpenHistory((prev) => ({ ...prev, [target.id]: true }))
            await applyStatusUpdate(target.id, 'Dibatalkan / Ditutup', reasonText)
          }}
        />
      )}

      {deletingReport && (
        <DeleteReportDialog
          report={deletingReport}
          busy={updatingId === deletingReport.id}
          onClose={() => setDeletingReport(null)}
          onConfirm={async () => {
            const target = deletingReport
            setUpdatingId(target.id)
            try {
              await api.deleteReport(target.id)
              setReports((prev) => prev.filter((item) => item.id !== target.id))
              setDeletingReport(null)
              setFeedback({
                type: 'success',
                message: `Laporan "${target.title}" berhasil dihapus.`,
              })
              showToast(`Laporan "${target.title}" berhasil dihapus.`, 'success')
            } catch (err) {
              const errMsg = err.message || 'Gagal menghapus laporan.'
              setFeedback({ type: 'error', message: errMsg })
              showToast(errMsg, 'error')
            } finally {
              setUpdatingId(null)
            }
          }}
        />
      )}
    </div>
  )
}

function DeleteReportDialog({ report, busy, onClose, onConfirm }) {
  const dialogRef = useRef(null)

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

  return (
    <dialog
      ref={dialogRef}
      className="sq-claim-dialog"
      aria-labelledby="delete-report-dialog-title"
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current && !busy) onClose()
      }}
    >
      <div className="sq-form-box sq-claim-box">
        <div className="sq-claim-head">
          <span className="sq-kicker-pill">HAPUS LAPORAN · #LF-{report.id}</span>
          <h2 id="delete-report-dialog-title">Hapus Laporan Ini?</h2>
          <p className="sq-claim-item">
            {report.title} · {report.location}
          </p>
        </div>

        <p className="sq-claim-privacy">
          Laporan ini akan dihapus dari daftar publik dan halaman Laporan Saya. Jika laporan hanya sudah selesai atau dibatalkan, Anda juga dapat menggunakan tombol <b>Tutup / Batalkan</b> agar tetap tercatat di riwayat.
        </p>

        <div className="sq-claim-actions">
          <button type="button" className="sq-btn sq-btn-outline" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button
            type="button"
            className="sq-btn sq-btn-outline sq-btn-danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Menghapus…' : 'Ya, Hapus Laporan'}
          </button>
        </div>
      </div>
    </dialog>
  )
}

function CloseReportDialog({ report, busy, onClose, onConfirm }) {
  const dialogRef = useRef(null)
  const [preset, setPreset] = useState(CLOSE_REASON_OPTIONS[0])
  const [customNote, setCustomNote] = useState('')
  const [error, setError] = useState('')

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

  const submit = (e) => {
    e.preventDefault()
    const finalReason =
      preset === 'Lainnya'
        ? customNote.trim()
        : customNote.trim()
          ? `${preset} (${customNote.trim()})`
          : preset
    if (!finalReason || finalReason.length < 3) {
      setError('Tuliskan alasan penutupan minimal 3 karakter.')
      return
    }
    onConfirm(finalReason)
  }

  return (
    <dialog
      ref={dialogRef}
      className="sq-claim-dialog"
      aria-labelledby="close-report-dialog-title"
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current && !busy) onClose()
      }}
    >
      <form className="sq-form-box sq-claim-box" onSubmit={submit} noValidate>
        <div className="sq-claim-head">
          <span className="sq-kicker-pill">TUTUP / BATALKAN LAPORAN · #LF-{report.id}</span>
          <h2 id="close-report-dialog-title">Catat Alasan Penutupan</h2>
          <p className="sq-claim-item">
            {report.title} · {report.location}
          </p>
        </div>

        <p className="sq-claim-privacy">
          Alasan penutupan atau pembatalan akan dicatat pada <b>Riwayat Status (Timeline)</b> agar jejak laporan tetap transparan.
        </p>

        {error && (
          <div className="sq-form-error" role="alert">
            {error}
          </div>
        )}

        <label className="sq-input-card">
          <span className="sq-input-label">Alasan Penutupan</span>
          <div className="sq-input-underline">
            <select
              className="sq-form-select"
              value={preset}
              onChange={(e) => {
                setPreset(e.target.value)
                setError('')
              }}
            >
              {CLOSE_REASON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="sq-input-card">
          <span className="sq-input-label">
            Catatan Tambahan {preset === 'Lainnya' ? '*' : '(opsional)'}
          </span>
          <div className="sq-input-underline">
            <textarea
              rows={3}
              maxLength={240}
              value={customNote}
              onChange={(e) => {
                setCustomNote(e.target.value)
                setError('')
              }}
              placeholder="Contoh: Sudah ketemu di meja perpustakaan lantai 2."
            />
          </div>
        </label>

        <div className="sq-claim-actions">
          <button type="button" className="sq-btn sq-btn-outline" onClick={onClose} disabled={busy}>
            Kembali
          </button>
          <button type="submit" className="sq-btn sq-btn-lime" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Tutup Laporan & Catat Alasan'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
