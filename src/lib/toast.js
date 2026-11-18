const TOAST_EVENT = 'lf:toast'

/**
 * Menampilkan pesan toast mengambang yang ramah pembaca layar (role="status", aria-live="polite").
 * @param {string} message Pesan yang ditampilkan
 * @param {'success' | 'info' | 'warning' | 'error'} [kind='success'] Jenis pesan
 */
export function showToast(message, kind = 'success') {
  if (typeof window === 'undefined' || !message) return
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        message: String(message),
        kind,
      },
    }),
  )
}

export { TOAST_EVENT }
