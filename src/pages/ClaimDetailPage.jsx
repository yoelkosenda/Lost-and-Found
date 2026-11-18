import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { Link } from '../router.jsx'
import { claimStatus } from '../lib/claimStatus.js'
import { showToast } from '../lib/toast.js'
import AppNavbar from '../components/layout/AppNavbar.jsx'
import StatusHistory from '../components/reports/StatusHistory.jsx'

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
      api.claimDetail(id),
      api.claimMessages(id),
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
          api.claimDetail(id),
          api.claimMessages(id),
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
      Promise.all([api.claimDetail(id), api.claimMessages(id)])
        .then(([{ claim: nextClaim }, { messages: nextMessages }]) => {
          if (active) {
            setClaim(nextClaim)
            setMessages(nextMessages ?? [])
          }
        })
        .catch(() => {})
    }, 5000)
    return () => {
      active = false
      window.clearInterval(poll)
    }
  }, [id])

  const runAction = async (action, successToast) => {
    setError('')
    try {
      await action()
      await loadClaim()
      if (successToast) showToast(successToast, 'success')
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
      showToast('Pesan terkirim ke ruang klaim.', 'success')
    } catch (reason) {
      setError(reason.message || 'Pesan tidak dapat dikirim.')
    } finally {
      setSending(false)
    }
  }

  const sharePhone = async (event) => {
    const agree = event.target.checked
    setSharing(true)
    await runAction(
      () => api.togglePhoneShare(id, agree),
      agree
        ? 'Persetujuan berbagi nomor telepon diaktifkan.'
        : 'Persetujuan berbagi nomor telepon dicabut.',
    )
    setSharing(false)
  }

  if (error && !claim) {
    return (
      <div className="sq-page">
        <AppNavbar user={user} onLogout={onLogout} active="my-claims" />
        <main className="sq-container sq-claim-detail-container">
          <div className="sq-state error" role="alert">
            <b>{error}</b>
            <Link className="sq-btn sq-btn-lime" to="/app/my-claims">
              Kembali ke klaim
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (!claim) {
    return (
      <div className="sq-page">
        <AppNavbar user={user} onLogout={onLogout} active="my-claims" />
        <main className="sq-container sq-claim-detail-container">
          <div className="sq-state" role="status">
            Memuat ruang klaim…
          </div>
        </main>
      </div>
    )
  }

  const isOwner = claim.is_owner === true || String(claim.owner_id) === String(user.id)
  const currentStatus = claimStatus(claim.status)
  const inHandover = ['approved', 'accepted'].includes(claim.status) && claim.report_status !== 'Sudah dikembalikan'
  const completed =
    claim.status === 'completed' ||
    (['approved', 'accepted'].includes(claim.status) && claim.report_status === 'Sudah dikembalikan')
  const rejected = claim.status === 'rejected'
  const currentStep = completed ? steps.length - 1 : inHandover ? 2 : 1
  const mutualConsent = claim.claimant_share_phone && claim.owner_share_phone

  return (
    <div className="sq-page">
      <AppNavbar user={user} onLogout={onLogout} active={isOwner ? 'my-reports' : 'my-claims'} />
      <main className="sq-container sq-claim-detail-container">
        <Link
          to={isOwner ? '/app/my-reports' : '/app/my-claims'}
          className="sq-btn sq-btn-outline sq-detail-back"
        >
          ← Kembali ke {isOwner ? 'Laporan Saya' : 'Klaim Saya'}
        </Link>
        <div className="sq-claim-detail-heading">
          <span className="sq-kicker-pill">RUANG VERIFIKASI KLAIM · #LF-{claim.report_id}</span>
          <h1>{claim.report_title}</h1>
          <p>
            {claim.report_category} · {claim.report_location} · Status laporan:{' '}
            <b>{claim.report_status}</b>
          </p>
        </div>

        {error && (
          <div className="sq-form-error sq-claim-inline-error" role="alert">
            {error}
          </div>
        )}

        <section className="sq-section sq-claim-stepper" aria-label="Tahapan klaim">
          <ol>
            {steps.map((step, index) => {
              const isStepComplete = completed || index < currentStep
              const isStepCurrent = !completed && index === currentStep
              return (
                <li
                  key={step}
                  className={isStepComplete ? 'complete' : isStepCurrent ? 'current' : ''}
                >
                  <span className="sq-claim-step-number">{isStepComplete ? '✓' : index + 1}</span>
                  <span>{step}</span>
                </li>
              )
            })}
          </ol>
          {rejected && (
            <p className="sq-claim-rejected" role="status">
              Klaim ini ditolak. Status laporan saat ini: <b>{claim.report_status}</b>.
            </p>
          )}
          {inHandover && (
            <p className="sq-claim-handover-note" role="status">
              Tahap Serah Terima: Bukti kepemilikan cocok. Silakan sepakati lokasi & waktu serah terima di kampus, lalu penemu menekan tombol konfirmasi setelah barang diserahkan.
            </p>
          )}
          {completed && (
            <p className="sq-claim-completed-note" role="status">
              ✓ Serah terima selesai. Barang telah dikembalikan kepada pemilik yang sah.
            </p>
          )}
        </section>

        <div className="sq-claim-detail-grid">
          <div className="sq-claim-detail-primary">
            <section className="sq-section sq-claim-review">
              <div className="sq-claim-section-heading">
                <div>
                  <span className="sq-kicker-pill">VERIFIKASI PENEMU</span>
                  <h2>Bukti kepemilikan</h2>
                </div>
                <em className={`sq-status-badge ${completed ? 'found' : currentStatus.badge}`}>
                  {completed ? 'Sudah Dikembalikan' : currentStatus.label}
                </em>
              </div>
              <p className="sq-claim-participant">
                {claim.claimant_name} mengajukan klaim pada{' '}
                {new Date(claim.submitted_at).toLocaleString('id-ID')}.
              </p>
              <blockquote className="sq-claim-proof-detail">
                {claim.proof || 'Bukti kepemilikan tidak tersedia.'}
              </blockquote>

              {isOwner && claim.status === 'pending' && (
                <div className="sq-claim-decision-actions">
                  <button
                    type="button"
                    className="sq-btn sq-btn-lime"
                    disabled={deciding}
                    onClick={async () => {
                      setDeciding(true)
                      await runAction(
                        () => api.decideClaim(id, 'approved'),
                        'Klaim diterima! Silakan koordinasikan serah terima barang di kampus.',
                      )
                      setDeciding(false)
                    }}
                  >
                    {deciding ? 'Memproses…' : '✓ Terima Klaim (Lanjut Serah Terima)'}
                  </button>
                  <button
                    type="button"
                    className="sq-btn sq-btn-outline sq-btn-danger"
                    disabled={deciding}
                    onClick={async () => {
                      setDeciding(true)
                      await runAction(
                        () => api.decideClaim(id, 'rejected'),
                        'Klaim ditolak dan pengaju telah diberi tahu.',
                      )
                      setDeciding(false)
                    }}
                  >
                    Tolak Klaim
                  </button>
                </div>
              )}

              {isOwner && inHandover && (
                <div className="sq-claim-handover-box">
                  <p className="sq-claim-wait-note">
                    Status <b>Sudah dikembalikan</b> hanya diaktifkan setelah barang benar-benar diserahkan secara fisik kepada <b>{claim.claimant_name}</b> di kampus.
                  </p>
                  <div className="sq-claim-decision-actions">
                    <button
                      type="button"
                      className="sq-btn sq-btn-lime"
                      disabled={deciding}
                      onClick={async () => {
                        setDeciding(true)
                        await runAction(
                          () => api.decideClaim(id, 'completed'),
                          'Serah terima dikonfirmasi! Laporan kini berstatus Sudah dikembalikan.',
                        )
                        setDeciding(false)
                      }}
                    >
                      {deciding ? 'Memproses…' : '✓ Konfirmasi Barang Sudah Diserahkan'}
                    </button>
                    <button
                      type="button"
                      className="sq-btn sq-btn-outline sq-btn-danger"
                      disabled={deciding}
                      onClick={async () => {
                        setDeciding(true)
                        await runAction(
                          () => api.decideClaim(id, 'rejected'),
                          'Serah terima dibatalkan dan klaim ditolak.',
                        )
                        setDeciding(false)
                      }}
                    >
                      Batalkan Serah Terima
                    </button>
                  </div>
                </div>
              )}

              {!isOwner && claim.status === 'pending' && (
                <p className="sq-claim-wait-note">
                  Bukti Anda bersifat rahasia dan hanya dapat dilihat oleh Anda dan penemu untuk keperluan verifikasi.
                </p>
              )}
              {!isOwner && inHandover && (
                <p className="sq-claim-wait-note">
                  Bukti Anda telah disetujui penemu! Gunakan ruang pesan di bawah untuk menyepakati titik temu serah terima di kampus.
                </p>
              )}
            </section>

            <section className="sq-section sq-claim-chat">
              <div className="sq-claim-section-heading">
                <div>
                  <span className="sq-kicker-pill">PESAN INTERNAL</span>
                  <h2>Koordinasi dengan {isOwner ? claim.claimant_name : claim.owner_name}</h2>
                </div>
              </div>
              <div className="sq-chat-messages" aria-live="polite" aria-label="Percakapan klaim">
                {messages.length ? (
                  messages.map((item) => (
                    <article
                      key={item.id}
                      className={`sq-chat-message ${
                        String(item.sender_id) === String(user.id) ? 'mine' : ''
                      }`}
                    >
                      <div>
                        <b>
                          {item.sender_name ||
                            (String(item.sender_id) === String(user.id) ? 'Anda' : 'Mahasiswa')}
                        </b>
                        <time>
                          {new Date(item.created_at).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </time>
                      </div>
                      <p>{item.message}</p>
                    </article>
                  ))
                ) : (
                  <p className="sq-chat-empty">
                    Belum ada pesan. Gunakan ruang ini untuk menyepakati verifikasi dan serah terima di kampus.
                  </p>
                )}
              </div>
              <form className="sq-chat-compose" onSubmit={submitMessage}>
                <label htmlFor="claim-message">
                  Pesan untuk {isOwner ? 'pengaju klaim' : 'penemu'}
                </label>
                <textarea
                  id="claim-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Contoh: Halo, barangnya bisa diambil di Student Center besok jam 12.00 WITA?"
                />
                <button
                  type="submit"
                  className="sq-btn sq-btn-lime"
                  disabled={sending || !message.trim()}
                >
                  {sending ? 'Mengirim…' : 'Kirim Pesan'}
                </button>
              </form>
            </section>
          </div>

          <aside className="sq-claim-detail-secondary">
            <section className="sq-section sq-phone-share">
              <span className="sq-kicker-pill">KONTAK OPSIONAL</span>
              <h2>Berbagi nomor telepon</h2>
              <p>Nomor hanya akan terlihat jika pengaju klaim dan penemu sama-sama menyetujui.</p>
              <label className="sq-phone-consent">
                <input
                  type="checkbox"
                  checked={Boolean(isOwner ? claim.owner_share_phone : claim.claimant_share_phone)}
                  disabled={sharing}
                  onChange={sharePhone}
                />
                <span>Saya setuju membagikan nomor telepon kepada pihak lain dalam klaim ini.</span>
              </label>
              <label className="sq-phone-consent" style={{ opacity: 0.75 }}>
                <input
                  type="checkbox"
                  checked={Boolean(isOwner ? claim.claimant_share_phone : claim.owner_share_phone)}
                  disabled
                  readOnly
                />
                <span>
                  {isOwner ? claim.claimant_name : claim.owner_name}{' '}
                  {Boolean(isOwner ? claim.claimant_share_phone : claim.owner_share_phone)
                    ? '(sudah setuju)'
                    : '(belum setuju)'}
                </span>
              </label>
              {mutualConsent ? (
                <div className="sq-phone-revealed" role="status">
                  <p>
                    <b>{claim.owner_name}</b>
                    <span>{claim.owner_phone || 'Nomor telepon belum diatur di Profil.'}</span>
                  </p>
                  <p>
                    <b>{claim.claimant_name}</b>
                    <span>{claim.claimant_phone || 'Nomor telepon belum diatur di Profil.'}</span>
                  </p>
                </div>
              ) : (
                <p className="sq-phone-hidden">
                  Nomor telepon masih tersembunyi sampai kedua kotak persetujuan dicentang.
                </p>
              )}
            </section>

            <section className="sq-section sq-claim-report-link">
              <span className="sq-kicker-pill">RIWAYAT STATUS LAPORAN</span>
              <h2>{claim.report_title}</h2>
              <p style={{ marginBottom: '12px' }}>{claim.report_location}</p>
              <StatusHistory
                reportId={claim.report_id}
                currentStatus={claim.report_status}
                refreshKey={`${claim.status}-${claim.report_status}`}
                compact
              />
              <Link
                to={`/app/reports/${claim.report_id}`}
                className="sq-btn sq-btn-outline"
                style={{ marginTop: '14px' }}
              >
                Lihat detail laporan
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
