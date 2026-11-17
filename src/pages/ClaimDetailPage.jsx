import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { Link } from '../router.jsx'
import { claimStatus } from '../lib/claimStatus.js'

const steps = ['Diajukan', 'Verifikasi penemu', 'Serah terima', 'Sudah dikembalikan']

export default function ClaimDetailPage({ id, user, onLogout }) {
  const [claim, setClaim] = useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [deciding, setDeciding] = useState(false)
  const [sharing, setSharing] = useState(false)

  const loadClaim = useCallback(async () => {
    const [{ claim: nextClaim }, { messages: nextMessages }] = await Promise.all([
      api.claimDetail(id), api.claimMessages(id),
    ])
    setClaim(nextClaim)
    setMessages(nextMessages ?? [])
  }, [id])

  useEffect(() => {
    let active = true
    const load = async () => {
      setError('')
      try {
        const [{ claim: nextClaim }, { messages: nextMessages }] = await Promise.all([
          api.claimDetail(id), api.claimMessages(id),
        ])
        if (active) {
          setClaim(nextClaim)
          setMessages(nextMessages ?? [])
        }
      } catch (reason) {
        if (active) setError(reason.message || 'Gagal memuat ruang klaim.')
      }
    }
    load()
    const poll = window.setInterval(() => {
      Promise.all([api.claimDetail(id), api.claimMessages(id)]).then(([{ claim: nextClaim }, { messages: nextMessages }]) => {
        if (active) {
          setClaim(nextClaim)
          setMessages(nextMessages ?? [])
        }
      }).catch(() => {})
    }, 5000)
    return () => {
      active = false
      window.clearInterval(poll)
    }
  }, [id])

  const runAction = async (action) => {
    setError('')
    try {
      await action()
      await loadClaim()
    } catch (reason) {
      setError(reason.message || 'Tindakan tidak dapat diproses.')
    }
  }

  const submitMessage = async (event) => {
    event.preventDefault()
    const text = message.trim()
    if (!text || sending) return
    setSending(true)
    setError('')
    try {
      await api.sendClaimMessage(id, text)
      setMessage('')
      const { messages: nextMessages } = await api.claimMessages(id)
      setMessages(nextMessages ?? [])
    } catch (reason) {
      setError(reason.message || 'Pesan tidak dapat dikirim.')
    } finally {
      setSending(false)
    }
  }

  const sharePhone = async (event) => {
    const agree = event.target.checked
    setSharing(true)
    await runAction(() => api.togglePhoneShare(id, agree))
    setSharing(false)
  }

  if (error && !claim) {
    return (
      <div className="sq-page">
        <ClaimNavbar user={user} onLogout={onLogout} />
        <main className="sq-container sq-claim-detail-container">
          <div className="sq-state error" role="alert"><b>{error}</b><Link className="sq-btn sq-btn-lime" to="/app/my-claims">Kembali ke klaim</Link></div>
        </main>
      </div>
    )
  }

  if (!claim) {
    return (
      <div className="sq-page">
        <ClaimNavbar user={user} onLogout={onLogout} />
        <main className="sq-container sq-claim-detail-container"><div className="sq-state" role="status">Memuat ruang klaim…</div></main>
      </div>
    )
  }

  const isOwner = claim.is_owner === true || String(claim.owner_id) === String(user.id)
  const currentStatus = claimStatus(claim.status)
  const completed = ['approved', 'accepted'].includes(claim.status)
  const rejected = claim.status === 'rejected'
  const currentStep = completed ? steps.length - 1 : rejected ? 1 : 1
  const mutualConsent = claim.claimant_share_phone && claim.owner_share_phone

  return (
    <div className="sq-page">
      <ClaimNavbar user={user} onLogout={onLogout} />
      <main className="sq-container sq-claim-detail-container">
        <Link to={isOwner ? '/app/my-reports' : '/app/my-claims'} className="sq-btn sq-btn-outline sq-detail-back">
          ← Kembali ke {isOwner ? 'Laporan Saya' : 'Klaim Saya'}
        </Link>
        <div className="sq-claim-detail-heading">
          <span className="sq-kicker-pill">RUANG VERIFIKASI KLAIM · #LF-{claim.report_id}</span>
          <h1>{claim.report_title}</h1>
          <p>{claim.report_category} · {claim.report_location}</p>
        </div>

        {error && <div className="sq-form-error sq-claim-inline-error" role="alert">{error}</div>}

        <section className="sq-section sq-claim-stepper" aria-label="Tahapan klaim">
          <ol>
            {steps.map((step, index) => (
              <li key={step} className={index < currentStep ? 'complete' : index === currentStep ? 'current' : ''}>
                <span className="sq-claim-step-number">{index < currentStep ? '✓' : index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {rejected && <p className="sq-claim-rejected" role="status">Klaim ditolak. Status laporan dikembalikan ke Menunggu pemilik.</p>}
        </section>

        <div className="sq-claim-detail-grid">
          <div className="sq-claim-detail-primary">
            <section className="sq-section sq-claim-review">
              <div className="sq-claim-section-heading">
                <div><span className="sq-kicker-pill">VERIFIKASI PENEMU</span><h2>Bukti kepemilikan</h2></div>
                <em className={`sq-status-badge ${currentStatus.badge}`}>{currentStatus.label}</em>
              </div>
              <p className="sq-claim-participant">{claim.claimant_name} mengajukan klaim pada {new Date(claim.submitted_at).toLocaleString('id-ID')}.</p>
              <blockquote className="sq-claim-proof-detail">{claim.proof || 'Bukti kepemilikan tidak tersedia.'}</blockquote>
              {isOwner && claim.status === 'pending' && (
                <div className="sq-claim-decision-actions">
                  <button type="button" className="sq-btn sq-btn-lime" disabled={deciding} onClick={async () => {
                    setDeciding(true)
                    await runAction(() => api.decideClaim(id, 'approved'))
                    setDeciding(false)
                  }}>{deciding ? 'Memproses…' : 'Terima Klaim'}</button>
                  <button type="button" className="sq-btn sq-btn-outline sq-btn-danger" disabled={deciding} onClick={async () => {
                    setDeciding(true)
                    await runAction(() => api.decideClaim(id, 'rejected'))
                    setDeciding(false)
                  }}>Tolak Klaim</button>
                </div>
              )}
              {!isOwner && claim.status === 'pending' && <p className="sq-claim-wait-note">Bukti Anda hanya dapat dilihat oleh Anda dan penemu untuk keperluan verifikasi.</p>}
            </section>

            <section className="sq-section sq-claim-chat">
              <div className="sq-claim-section-heading"><div><span className="sq-kicker-pill">PESAN INTERNAL</span><h2>Koordinasi dengan {isOwner ? claim.claimant_name : claim.owner_name}</h2></div></div>
              <div className="sq-chat-messages" aria-live="polite" aria-label="Percakapan klaim">
                {messages.length ? messages.map((item) => (
                  <article key={item.id} className={`sq-chat-message ${String(item.sender_id) === String(user.id) ? 'mine' : ''}`}>
                    <div><b>{item.sender_name || (String(item.sender_id) === String(user.id) ? 'Anda' : 'Mahasiswa')}</b><time>{new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</time></div>
                    <p>{item.message}</p>
                  </article>
                )) : <p className="sq-chat-empty">Belum ada pesan. Gunakan ruang ini untuk menyepakati verifikasi dan serah terima di kampus.</p>}
              </div>
              <form className="sq-chat-compose" onSubmit={submitMessage}>
                <label htmlFor="claim-message">Pesan untuk {isOwner ? 'pengaju klaim' : 'penemu'}</label>
                <textarea id="claim-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} rows={3} placeholder="Tulis pesan koordinasi…" />
                <button type="submit" className="sq-btn sq-btn-lime" disabled={sending || !message.trim()}>{sending ? 'Mengirim…' : 'Kirim Pesan'}</button>
              </form>
            </section>
          </div>

          <aside className="sq-claim-detail-secondary">
            <section className="sq-section sq-phone-share">
              <span className="sq-kicker-pill">KONTAK OPSIONAL</span>
              <h2>Berbagi nomor telepon</h2>
              <p>Nomor hanya akan terlihat jika pengaju klaim dan penemu sama-sama menyetujui.</p>
              <label className="sq-phone-consent">
                <input type="checkbox" checked={Boolean(isOwner ? claim.owner_share_phone : claim.claimant_share_phone)} disabled={sharing} onChange={sharePhone} />
                <span>Saya setuju membagikan nomor telepon kepada pihak lain dalam klaim ini.</span>
              </label>
              {mutualConsent ? (
                <div className="sq-phone-revealed" role="status">
                  <p><b>{claim.owner_name}</b><span>{claim.owner_phone || 'Nomor telepon belum tersedia.'}</span></p>
                  <p><b>{claim.claimant_name}</b><span>{claim.claimant_phone || 'Nomor telepon belum tersedia.'}</span></p>
                </div>
              ) : <p className="sq-phone-hidden">Nomor telepon masih tersembunyi sampai kedua pihak menyetujui.</p>}
            </section>
            <section className="sq-section sq-claim-report-link">
              <span className="sq-kicker-pill">LAPORAN TERKAIT</span>
              <h2>{claim.report_title}</h2>
              <p>{claim.report_location}</p>
              <Link to={`/app/reports/${claim.report_id}`} className="sq-btn sq-btn-outline">Lihat detail laporan</Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}

function ClaimNavbar({ user, onLogout }) {
  const initials = user.name.split(' ').map((part) => part[0]).join('')
  return (
    <header className="sq-navbar">
      <div className="sq-navbar-inner">
        <Link to="/app" className="sq-brand" aria-label="Dashboard Lost and Found UNKLAB">
          <span className="sq-brand-box"><img src="/figma/logo-cube.svg" alt="" width="38" height="43" /></span>
          <span className="sq-brand-text">Lost and Found<span>.</span><small>UNKLAB</small></span>
        </Link>
        <nav className="sq-nav-links" aria-label="Navigasi utama"><Link to="/app/my-claims" className="sq-nav-item active">Klaim Saya</Link><Link to="/app/my-reports" className="sq-nav-item">Laporan Saya</Link></nav>
        <div className="sq-account-bar"><div className="sq-user-chip"><span className="sq-avatar">{initials}</span><div className="sq-user-meta"><b>{user.name}</b><small>Mahasiswa</small></div></div><button type="button" className="sq-btn sq-btn-outline sq-logout-btn" onClick={onLogout}>Keluar</button></div>
      </div>
    </header>
  )
}
