import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api.js'
import GoogleMapPin from '../maps/GoogleMapPin.jsx'
import ReportImagePreview from './ReportImagePreview.jsx'
import {
  CAMPUS_LOCATIONS,
  CAMPUS_LOCATION_NAMES,
  CAMPUS_MAX_RADIUS_METERS,
  distanceFromCampusCenter,
  findNearestCampusLocation,
  getCoordinatesForLocation,
  getCoordinatesForReport,
  isWithinCampusBounds,
} from '../../lib/campusLocations.js'

const CATEGORIES = ['Elektronik', 'Aksesori', 'Kunci', 'Dokumen/Buku', 'Perlengkapan', 'Pakaian', 'Lainnya']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function ReportEditModal({ report, userId, onClose, onSaved }) {
  const dialogRef = useRef(null)
  const initialCoords = getCoordinatesForReport(report)
  const [form, setForm] = useState({
    title: report.title || '',
    category: report.category || '',
    location: report.location || CAMPUS_LOCATION_NAMES[0],
    color: report.color || '',
    description: report.description || '',
    latitude: initialCoords.lat,
    longitude: initialCoords.lng,
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [removeImage, setRemoveImage] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('')
      return undefined
    }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const close = () => {
    if (!saving) onClose()
  }

  const locationOptions = CAMPUS_LOCATION_NAMES.includes(form.location)
    ? CAMPUS_LOCATION_NAMES
    : [form.location, ...CAMPUS_LOCATION_NAMES]

  async function submit(event) {
    event.preventDefault()
    const values = {
      title: form.title.trim(),
      category: form.category,
      location: form.location.trim(),
      color: form.color.trim(),
      description: form.description.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
    }
    if (!values.title || !values.category || !values.location || !values.color || !values.description) {
      setError('Nama, kategori, lokasi, warna, dan deskripsi wajib diisi.')
      return
    }
    if (!isWithinCampusBounds(values.latitude, values.longitude)) {
      setError(`Titik pin berada di luar batas area Kampus UNKLAB (maks. ${CAMPUS_MAX_RADIUS_METERS} m dari pusat kampus).`)
      return
    }

    setError('')
    setSaving(true)
    try {
      const imageUrl = imageFile
        ? await api.uploadReportImage(imageFile, userId)
        : removeImage
          ? null
          : report.image_url
      const result = await api.updateReport(report.id, { ...values, image_url: imageUrl })
      onSaved({ ...report, ...values, image_url: imageUrl, ...(result?.report || {}) })
    } catch (reason) {
      setError(reason.message || 'Gagal menyimpan perubahan laporan.')
      setSaving(false)
    }
  }

  return (
    <>
      <dialog
        ref={dialogRef}
        className="sq-report-edit-dialog"
        aria-labelledby="report-edit-title"
        onCancel={(event) => {
          event.preventDefault()
          close()
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) close()
        }}
      >
        <form className="sq-form-box sq-report-edit-box" onSubmit={submit} noValidate>
          <div className="sq-claim-head">
            <span className="sq-kicker-pill">EDIT LAPORAN · #LF-{report.id}</span>
            <h2 id="report-edit-title">Perbarui Detail Laporan</h2>
            <p className="sq-claim-item">{report.title}</p>
          </div>

          {error && <div className="sq-form-error" role="alert">{error}</div>}

          <div className="sq-form-row">
            <label className="sq-input-card">
              <span className="sq-input-label">Nama Barang</span>
              <div className="sq-input-underline">
                <input
                  value={form.title}
                  maxLength={120}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </div>
            </label>
            <label className="sq-input-card">
              <span className="sq-input-label">Kategori</span>
              <div className="sq-input-underline">
                <select
                  className="sq-form-select"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  required
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          <div className="sq-form-row">
            <label className="sq-input-card">
              <span className="sq-input-label">Lokasi di Kampus</span>
              <div className="sq-input-underline">
                <select
                  className="sq-form-select"
                  value={form.location}
                  onChange={(event) => {
                    const nextLoc = event.target.value
                    const coords = getCoordinatesForLocation(nextLoc)
                    setForm((prev) => ({
                      ...prev,
                      location: nextLoc,
                      latitude: coords.lat,
                      longitude: coords.lng,
                    }))
                    setError('')
                  }}
                  required
                >
                  {locationOptions.map((loc) => (
                    <option key={loc} value={loc}>
                      {CAMPUS_LOCATIONS[loc]?.label || loc}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <label className="sq-input-card">
              <span className="sq-input-label">Warna Barang</span>
              <div className="sq-input-underline">
                <input
                  value={form.color}
                  maxLength={100}
                  onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
                  required
                />
              </div>
            </label>
          </div>

          <div className="sq-input-card">
            <span className="sq-input-label">Titik Pin di Peta Kampus</span>
            <GoogleMapPin
              lat={form.latitude}
              lng={form.longitude}
              title={form.title || report.title}
              subtitle={form.location}
              type={report.type}
              height={200}
              interactive
              onSelect={({ lat, lng }) => {
                if (!isWithinCampusBounds(lat, lng)) {
                  const dist = Math.round(distanceFromCampusCenter(lat, lng))
                  setError(
                    `Pin di luar batas kampus (${dist} m dari pusat UNKLAB, maks. ${CAMPUS_MAX_RADIUS_METERS} m).`,
                  )
                  return
                }
                const nearestLocation = findNearestCampusLocation(lat, lng)
                setForm((prev) => ({
                  ...prev,
                  location: nearestLocation,
                  latitude: lat,
                  longitude: lng,
                }))
                setError('')
              }}
            />
            <small className="sq-field-hint">Klik peta untuk menyesuaikan titik lokasi di area kampus.</small>
          </div>

          <label className="sq-input-card">
            <span className="sq-input-label">Deskripsi Detail</span>
            <div className="sq-input-underline">
              <textarea
                value={form.description}
                rows={4}
                maxLength={1000}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                required
              />
            </div>
          </label>

          <div className="sq-input-card">
            <span className="sq-input-label">Foto Barang</span>
            <div className="sq-file-input-wrap">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Pilih foto barang pengganti"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null
                  if (file && (!IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE)) {
                    setImageFile(null)
                    setError(
                      file.size > MAX_IMAGE_SIZE
                        ? 'Ukuran foto maksimal 5 MB.'
                        : 'Foto harus berformat JPG, PNG, atau WebP.',
                    )
                    event.target.value = ''
                    return
                  }
                  setError('')
                  setImageFile(file)
                  if (file) setRemoveImage(false)
                }}
              />
            </div>
            <small className="sq-field-hint">
              Unggah foto baru untuk mengganti foto saat ini (maksimal 5 MB).
            </small>
            {report.image_url && !imageFile && (
              <div className="sq-edit-image-actions">
                <button
                  type="button"
                  className="sq-btn sq-btn-outline"
                  onClick={() => setPreviewOpen(true)}
                >
                  Lihat Foto Saat Ini
                </button>
                <label className="sq-remove-image">
                  <input
                    type="checkbox"
                    checked={removeImage}
                    onChange={(event) => setRemoveImage(event.target.checked)}
                  />
                  Hapus foto saat ini
                </label>
              </div>
            )}
            {imagePreview && (
              <div className="sq-edit-image-actions">
                <button
                  type="button"
                  className="sq-btn sq-btn-outline"
                  onClick={() => setPreviewOpen(true)}
                >
                  Lihat Foto Baru
                </button>
                <button
                  type="button"
                  className="sq-btn sq-btn-outline"
                  onClick={() => setImageFile(null)}
                >
                  Batalkan Foto Baru
                </button>
              </div>
            )}
          </div>

          <div className="sq-claim-actions">
            <button type="button" className="sq-btn sq-btn-outline" onClick={close} disabled={saving}>
              Batal
            </button>
            <button type="submit" className="sq-btn sq-btn-lime" disabled={saving} aria-busy={saving}>
              {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </dialog>
      {previewOpen && (imagePreview || report.image_url) && (
        <ReportImagePreview
          imageUrl={imagePreview || report.image_url}
          title={form.title || report.title}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  )
}
