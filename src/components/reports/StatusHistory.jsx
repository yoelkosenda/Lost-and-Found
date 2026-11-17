import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'

function getStatusTone(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('ditemukan') || s.includes('dikembalikan')) return 'done'
  if (s.includes('diklaim') || s.includes('verifikasi')) return 'claim'
  if (s.includes('dibatalkan') || s.includes('ditutup')) return 'closed'
  if (s.includes('menunggu')) return 'found'
  return 'lost'
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function StatusHistory({
  reportId,
  currentStatus,
  reportedAt,
  refreshKey = 0,
  compact = false,
}) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!reportId) return undefined
    let active = true
    setLoading(true)
    setError('')

    api
      .reportHistory(reportId)
      .then((res) => {
        if (!active) return
        setHistory(Array.isArray(res?.history) ? res.history : [])
      })
      .catch((err) => {
        if (!active) return
        setError(err.message || 'Gagal memuat riwayat status.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reportId, currentStatus, refreshKey])

  if (loading) {
    return (
      <div className={`sq-timeline ${compact ? 'compact' : ''}`} role="status" aria-live="polite">
        <p className="sq-timeline-empty">Memuat riwayat status…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`sq-timeline ${compact ? 'compact' : ''}`}>
        {currentStatus ? (
          <ol className="sq-timeline-list" aria-label="Riwayat status laporan">
            <li className="sq-timeline-item latest">
              <span className={`sq-timeline-dot ${getStatusTone(currentStatus)}`} aria-hidden="true" />
              <div className="sq-timeline-body">
                <div className="sq-timeline-head">
                  <span className={`sq-timeline-status ${getStatusTone(currentStatus)}`}>
                    {currentStatus}
                  </span>
                  {reportedAt && <time className="sq-timeline-time">{formatDateTime(reportedAt)}</time>}
                </div>
                <p className="sq-timeline-note">Status laporan saat ini</p>
              </div>
            </li>
          </ol>
        ) : (
          <p className="sq-timeline-error">{error}</p>
        )}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className={`sq-timeline ${compact ? 'compact' : ''}`}>
        <p className="sq-timeline-empty">Belum ada catatan perubahan status untuk laporan ini.</p>
      </div>
    )
  }

  return (
    <div className={`sq-timeline ${compact ? 'compact' : ''}`}>
      <ol className="sq-timeline-list" aria-label="Riwayat status laporan">
        {history.map((item, idx) => {
          const isLatest = idx === history.length - 1
          const tone = getStatusTone(item.status)
          return (
            <li
              key={item.id ?? `${item.status}-${item.created_at}-${idx}`}
              className={`sq-timeline-item ${isLatest ? 'latest' : ''}`}
            >
              <span className={`sq-timeline-dot ${tone}`} aria-hidden="true" />
              <div className="sq-timeline-body">
                <div className="sq-timeline-head">
                  <span className={`sq-timeline-status ${tone}`}>{item.status}</span>
                  <time className="sq-timeline-time" dateTime={item.created_at}>
                    {formatDateTime(item.created_at)}
                  </time>
                </div>
                {item.note && <p className="sq-timeline-note">{item.note}</p>}
                {item.changed_by_name && !compact && (
                  <small className="sq-timeline-actor">Oleh {item.changed_by_name}</small>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
