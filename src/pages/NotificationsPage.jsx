import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { announceUnread, notificationKind, timeAgo } from '../lib/notifications.js'
import { Link } from '../router.jsx'
import AppNavbar from '../components/layout/AppNavbar.jsx'
import AppFooter from '../components/layout/AppFooter.jsx'

export default function NotificationsPage({ user, onLogout }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [marking, setMarking] = useState(false)
  const [markError, setMarkError] = useState('')

  const load = () => {
    setError('')
    api
      .notifications()
      .then((d) => {
        setData(d)
        announceUnread(d.unread_count ?? 0)
      })
      .catch((e) => setError(e.message))
  }

  useEffect(load, [])

  async function markAll() {
    setMarking(true)
    setMarkError('')
    try {
      await api.markNotificationsRead()
      setData((d) => ({ ...d, unread_count: 0, notifications: d.notifications.map((n) => ({ ...n, is_read: true })) }))
      announceUnread(0)
    } catch (e) {
      setMarkError(e.message)
    } finally {
      setMarking(false)
    }
  }

  const unread = data?.unread_count ?? 0
  const list = useMemo(
    () => (data?.notifications ?? []).filter((n) => filter === 'all' || !n.is_read),
    [data, filter],
  )

  return (
    <div className="sq-page">
      <AppNavbar user={user} onLogout={onLogout} active="notifications" />

      <main className="sq-container">
        <section className="sq-dash-hero sq-page-hero">
          <img src="/figma/banner-wave-2.png" alt="" className="sq-banner-wave" aria-hidden="true" />
          <div className="sq-banner-dots" aria-hidden="true" />
          <div className="sq-banner-tint" aria-hidden="true" />
          <div className="sq-dash-hero-grid">
            <div className="sq-dash-welcome">
              <span className="sq-kicker-pill">NOTIFIKASI</span>
              <h1>
                Kabar terbaru
                <br />
                <span>untuk barang Anda.</span>
              </h1>
              <p>Klaim baru atas barang temuan Anda, keputusan klaim, dan laporan yang mungkin cocok dikumpulkan di sini.</p>
            </div>
            <div className="sq-dash-highlight">
              <div className="sq-icon-badge">
                <img src="/figma/icon-why-2.svg" alt="" width="40" height="40" />
              </div>
              <p>Belum dibaca</p>
              <strong>{data ? unread : '—'}</strong>
              <small>Dari {data ? data.notifications.length : '—'} notifikasi terakhir</small>
            </div>
          </div>
        </section>

        <section className="sq-section">
          <div className="sq-dash-toolbar">
            <div>
              <span className="sq-kicker-pill">KOTAK MASUK</span>
              <h2>Semua Notifikasi</h2>
            </div>
            <div className="sq-filters">
              <div className="sq-segmented" role="group" aria-label="Filter notifikasi">
                <button type="button" className={filter === 'all' ? 'active' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
                  Semua
                </button>
                <button type="button" className={filter === 'unread' ? 'active' : ''} aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')}>
                  Belum dibaca{unread > 0 ? ` (${unread})` : ''}
                </button>
              </div>
              <button type="button" className="sq-btn sq-btn-lime sq-toolbar-btn" onClick={markAll} disabled={!data || unread === 0 || marking}>
                {marking ? 'Menandai…' : 'Tandai semua dibaca'}
              </button>
            </div>
          </div>

          {markError && (
            <div className="sq-form-error sq-inline-alert" role="alert">
              {markError}
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
            <div className="sq-state">Memuat notifikasi…</div>
          ) : list.length ? (
            <ul className="sq-notif-list">
              {list.map((n) => {
                const kind = notificationKind(n.kind)
                return (
                  <li key={n.id} className={`sq-notif-item${n.is_read ? '' : ' unread'}`}>
                    <div className="sq-icon-badge sm">
                      <img src={kind.icon} alt="" width="28" height="28" />
                    </div>
                    <div className="sq-notif-body">
                      <div className="sq-notif-meta">
                        <span className="sq-report-type-label">{kind.label}</span>
                        {!n.is_read && <em className="sq-status-badge found">Baru</em>}
                        <time dateTime={n.created_at} title={new Date(n.created_at).toLocaleString('id-ID')}>
                          {timeAgo(n.created_at)}
                        </time>
                      </div>
                      <h3>{n.title}</h3>
                      {n.body && <p>{n.body}</p>}
                    </div>
                    {n.link_path && (
                      <Link to={n.link_path} className="sq-btn sq-btn-outline sq-notif-open">
                        Buka ↗
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="sq-state">
              {filter === 'unread' ? 'Semua notifikasi sudah dibaca.' : 'Belum ada notifikasi. Kabar klaim dan laporan yang cocok akan muncul di sini.'}
            </div>
          )}
        </section>
      </main>

      <AppFooter user={user} />
    </div>
  )
}
