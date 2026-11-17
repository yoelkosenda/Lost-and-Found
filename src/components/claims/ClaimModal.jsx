import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api.js'

const MIN_LENGTH = 10
const MAX_LENGTH = 1000

export default function ClaimModal({ report, onClose, onSubmitted }) {
  const dialogRef = useRef(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog.open) dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      if (dialog.open) dialog.close()
    }
  }, [])

  const close = () => {
    if (!loading) onClose()
  }

  async function submit(e) {
    e.preventDefault()
    const proof = message.trim()
    if (proof.length < MIN_LENGTH) return setError(`Bukti kepemilikan wajib diisi minimal ${MIN_LENGTH} karakter.`)
    setError('')
    setLoading(true)
    try {
      const { claim } = await api.createClaim(report.id, proof)
      onSubmitted(claim)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="sq-claim-dialog"
      aria-labelledby="claim-dialog-title"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) close()
      }}
    >
      <form className="sq-form-box sq-claim-box" onSubmit={submit} noValidate>
        <div className="sq-claim-head">
          <span className="sq-kicker-pill">BARANG DITEMUKAN · #LF-{report.id}</span>
          <h2 id="claim-dialog-title">Pengajuan Klaim Kepemilikan</h2>
          <p className="sq-claim-item">
            {report.title} · {report.location}
          </p>
        </div>

        <p className="sq-claim-privacy">
          Sebutkan ciri khusus, nomor seri, isi barang, atau tanda unik lainnya yang tidak dipublikasikan. Informasi ini
          bersifat rahasia dan hanya digunakan untuk memverifikasi kepemilikan.
        </p>

        {error && (
          <div className="sq-form-error" role="alert">
            {error}
          </div>
        )}

        <label className="sq-input-card">
          <span className="sq-input-label">Bukti Kepemilikan</span>
          <div className="sq-input-underline">
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                if (error) setError('')
              }}
              rows={5}
              maxLength={MAX_LENGTH}
              placeholder="Contoh: ada goresan kecil di tutup kiri dan casing silikon hitam."
              aria-describedby="claim-proof-hint"
              autoFocus
            />
          </div>
          <span id="claim-proof-hint" className="sq-claim-hint">
            Minimal {MIN_LENGTH} karakter · {message.trim().length}/{MAX_LENGTH}
          </span>
        </label>

        <div className="sq-claim-actions">
          <button type="button" className="sq-btn sq-btn-outline" onClick={close} disabled={loading}>
            Batal
          </button>
          <button type="submit" className="sq-btn sq-btn-lime" disabled={loading}>
            {loading ? 'Mengirim klaim…' : 'Kirim Klaim'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
