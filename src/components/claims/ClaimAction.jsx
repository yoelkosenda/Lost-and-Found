import { useState } from 'react'
import { Link } from '../../router.jsx'
import { claimStatus, CLOSED_REPORT_STATUSES } from '../../lib/claimStatus.js'
import ClaimModal from './ClaimModal.jsx'

/**
 * Tombol + modal klaim untuk satu laporan. Dipakai pada kartu laporan dan dapat dipasang
 * langsung di halaman detail laporan (`<ClaimAction report={report} user={user} />`).
 *
 * `existingStatus` adalah status klaim terakhir user untuk laporan ini (dari `api.myClaims()`), bila ada.
 */
export default function ClaimAction({ report, user, existingStatus, onClaimed }) {
  const [open, setOpen] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState(false)

  if (report.type !== 'Found' || report.owner_id === user.id) return null

  const status = justSubmitted ? 'pending' : existingStatus
  const claimed = status === 'pending' || status === 'approved' || status === 'accepted'
  if (!claimed && CLOSED_REPORT_STATUSES.includes(report.status)) return null

  return (
    // stopPropagation: kartu induk boleh dibuat dapat diklik tanpa ikut terpicu oleh tombol/modal ini.
    <div className="sq-claim-action" onClick={(e) => e.stopPropagation()}>
      {justSubmitted && (
        <p className="sq-claim-success" role="status">
          Pengajuan klaim berhasil dikirim. Penemu barang akan memverifikasi bukti kepemilikan Anda.{' '}
          <Link to="/app/my-claims">Lihat Klaim Saya</Link>
        </p>
      )}

      {claimed ? (
        <em className={`sq-status-badge ${claimStatus(status).badge}`}>
          {status === 'pending' ? 'Klaim Telah Diajukan (Menunggu Verifikasi)' : claimStatus(status).label}
        </em>
      ) : (
        <button type="button" className="sq-btn sq-btn-lime" onClick={() => setOpen(true)}>
          Ajukan Klaim Barang Ini
        </button>
      )}

      {open && (
        <ClaimModal
          report={report}
          onClose={() => setOpen(false)}
          onSubmitted={(claim) => {
            setOpen(false)
            setJustSubmitted(true)
            onClaimed?.(claim)
          }}
        />
      )}
    </div>
  )
}
