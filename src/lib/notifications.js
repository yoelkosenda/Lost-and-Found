// Event lintas komponen: halaman Notifikasi memberi tahu lonceng di navbar saat jumlah belum-dibaca berubah.
export const NOTIFICATIONS_CHANGED = 'lf:notifications-changed'

export const NOTIFICATIONS_REFRESH = 'lf:notifications-refresh'

export function announceUnread(count) {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED, { detail: { unread: count } }))
}

// Minta lonceng memuat ulang jumlah belum-dibaca (mis. setelah aksi yang membuat notifikasi baru).
export function requestNotificationsRefresh() {
  window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH))
}

// Label teks per jenis notifikasi (status tidak boleh hanya warna).
const KINDS = {
  match: { label: 'SMART MATCH', icon: '/figma/icon-why-2.svg' },
  claim: { label: 'KLAIM BARU', icon: '/figma/icon-service-3.svg' },
  claim_status: { label: 'STATUS KLAIM', icon: '/figma/icon-service-3.svg' },
  report: { label: 'LAPORAN', icon: '/figma/icon-service-2.svg' },
  system: { label: 'INFO AKUN', icon: '/figma/icon-why-4.svg' },
}
export const notificationKind = (kind) => KINDS[kind] ?? KINDS.system

const rtf = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })
export function timeAgo(value, now = Date.now()) {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 45) return 'baru saja'
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour')
  if (abs < 86400 * 7) return rtf.format(Math.round(seconds / 86400), 'day')
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
