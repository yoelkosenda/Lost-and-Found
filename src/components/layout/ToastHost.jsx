import { useEffect, useState } from 'react'
import { TOAST_EVENT } from '../../lib/toast.js'

export default function ToastHost() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const onToast = (event) => {
      const item = event.detail
      if (!item?.message) return
      setToasts((prev) => [...prev.slice(-2), item])
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id))
      }, 3800)
    }
    window.addEventListener(TOAST_EVENT, onToast)
    return () => window.removeEventListener(TOAST_EVENT, onToast)
  }, [])

  if (toasts.length === 0) {
    return <div className="sq-toast-host" role="status" aria-live="polite" aria-atomic="true" />
  }

  return (
    <div className="sq-toast-host" role="status" aria-live="polite" aria-atomic="true">
      {toasts.map((item) => (
        <div key={item.id} className={`sq-toast ${item.kind || 'success'}`}>
          <span className="sq-toast-dot" aria-hidden="true" />
          <span className="sq-toast-text">{item.message}</span>
          <button
            type="button"
            className="sq-toast-close"
            aria-label="Tutup pesan"
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== item.id))}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
