import { useEffect, useRef } from 'react'

export default function ReportReviewModal({ report, imageUrl, error, loading, onClose, onPublish }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="sq-report-edit-dialog"
      aria-labelledby="report-review-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!loading) onClose()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !loading) onClose()
      }}
    >
      <section className="sq-form-box sq-report-edit-box sq-report-review-box">
        <div className="sq-claim-head">
          <span className="sq-kicker-pill">TINJAU SEBELUM TERBIT</span>
          <h2 id="report-review-title">Pratinjau Laporan</h2>
          <p className="sq-claim-item">Pastikan detail laporan sudah benar sebelum dibagikan ke komunitas.</p>
        </div>

        {error && <div className="sq-form-error" role="alert">{error}</div>}
        {imageUrl && <img className="sq-report-review-image" src={imageUrl} alt={`Pratinjau ${report.title}`} />}

        <dl className="sq-report-review-details">
          <div><dt>Tipe laporan</dt><dd>{report.type === 'Lost' ? 'Barang Hilang' : 'Barang Ditemukan'}</dd></div>
          <div><dt>Nama barang</dt><dd>{report.title}</dd></div>
          <div><dt>Kategori</dt><dd>{report.category}</dd></div>
          <div><dt>Warna barang</dt><dd>{report.color}</dd></div>
          <div><dt>Lokasi</dt><dd>{report.location}</dd></div>
          <div><dt>Tanggal kejadian</dt><dd>{report.date}</dd></div>
          <div><dt>Perkiraan jam</dt><dd>{report.estimated_time}</dd></div>
          <div className="sq-report-review-description"><dt>Deskripsi</dt><dd>{report.description}</dd></div>
        </dl>

        <div className="sq-claim-actions">
          <button type="button" className="sq-btn sq-btn-outline" onClick={onClose} disabled={loading}>
            Kembali Edit
          </button>
          <button type="button" className="sq-btn sq-btn-lime" onClick={onPublish} disabled={loading} aria-busy={loading}>
            {loading ? 'Menerbitkan…' : 'Terbitkan Laporan'}
          </button>
        </div>
      </section>
    </dialog>
  )
}
