import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { NOTIFICATIONS_CHANGED, NOTIFICATIONS_REFRESH } from '../../lib/notifications.js'
import { Link } from '../../router.jsx'

const POLL_MS = 60000

/** Ikon lonceng + badge jumlah belum dibaca. Bisa dipasang di navbar mana pun. */
export default function NotificationBell({ active = false }) {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let alive = true
    // Kegagalan (mis. migrasi belum dijalankan) cukup menyembunyikan badge; lonceng tetap bisa diklik.
    const refresh = () =>
      api
        .notifications()
        .then((data) => alive && setUnread(data.unread_count ?? 0))
        .catch(() => {})
    const onChanged = (e) => setUnread(e.detail?.unread ?? 0)
    const onVisible = () => document.visibilityState === 'visible' && refresh()

    refresh()
    const timer = setInterval(refresh, POLL_MS)
    window.addEventListener(NOTIFICATIONS_CHANGED, onChanged)
    window.addEventListener(NOTIFICATIONS_REFRESH, refresh)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      clearInterval(timer)
      window.removeEventListener(NOTIFICATIONS_CHANGED, onChanged)
      window.removeEventListener(NOTIFICATIONS_REFRESH, refresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const label = unread > 0 ? `Notifikasi, ${unread} belum dibaca` : 'Notifikasi, tidak ada yang belum dibaca'

  return (
    <Link
      to="/app/notifications"
      className={`sq-bell${active ? ' active' : ''}`}
      aria-label={label}
      title="Notifikasi"
      aria-current={active ? 'page' : undefined}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 9a6 6 0 1 1 12 0c0 3.2.8 5.3 1.6 6.5.4.6 0 1.5-.8 1.5H5.2c-.8 0-1.2-.9-.8-1.5C5.2 14.3 6 12.2 6 9Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M9.5 19.5a2.6 2.6 0 0 0 5 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      {unread > 0 && (
        <span className="sq-bell-badge" aria-hidden="true">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}
