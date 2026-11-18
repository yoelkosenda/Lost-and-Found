import { useEffect, useRef } from 'react'

export default function ReportImagePreview({ imageUrl, title, onClose }) {
  const dialogRef = useRef(null)

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

  return (
    <dialog
      ref={dialogRef}
      className="sq-image-preview-dialog"
      aria-label={`Pratinjau foto ${title}`}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      <div className="sq-image-preview-content">
        <div className="sq-image-preview-header">
          <strong>{title}</strong>
          <button type="button" className="sq-btn sq-btn-outline" onClick={onClose}>
            Tutup
          </button>
        </div>
        <img src={imageUrl} alt={`Foto ${title}`} />
      </div>
    </dialog>
  )
}
