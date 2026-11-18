import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { showToast } from '../lib/toast.js'
import { Link, navigate } from '../router.jsx'
import AppNavbar from '../components/layout/AppNavbar.jsx'
import GoogleMapPin from '../components/maps/GoogleMapPin.jsx'
import ReportImagePreview from '../components/reports/ReportImagePreview.jsx'
import ReportReviewModal from '../components/reports/ReportReviewModal.jsx'
import {
  CAMPUS_CENTER,
  CAMPUS_LOCATIONS,
  CAMPUS_LOCATION_NAMES,
  CAMPUS_MAX_RADIUS_METERS,
  distanceFromCampusCenter,
  findNearestCampusLocation,
  getCoordinatesForLocation,
  isWithinCampusBounds,
} from '../lib/campusLocations.js'

const CATEGORIES = ['Elektronik', 'Aksesori', 'Kunci', 'Dokumen/Buku', 'Perlengkapan', 'Pakaian', 'Lainnya']
const LOCATIONS = CAMPUS_LOCATION_NAMES

const pad = (n) => String(n).padStart(2, '0')
const toLocalDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const toLocalDateTime = (date, time) => {
  const offset = -new Date(`${date}T${time}:00`).getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const hours = pad(Math.floor(Math.abs(offset) / 60))
  const minutes = pad(Math.abs(offset) % 60)
  return `${date}T${time}:00${sign}${hours}:${minutes}`
}

const TYPE_OPTIONS = [
  { value: 'Lost', label: 'Barang Hilang (Lost)', hint: 'Saya kehilangan barang ini', status: 'Masih dicari' },
  { value: 'Found', label: 'Barang Ditemukan (Found)', hint: 'Saya menemukan barang ini', status: 'Menunggu pemilik' },
]

function getTypeFromSearch(search) {
  try {
    const param = new URLSearchParams(search || window.location.search).get('type')
    if (!param) return 'Lost'
    return param.toLowerCase() === 'found' || param.toUpperCase() === 'F' ? 'Found' : 'Lost'
  } catch {
    return 'Lost'
  }
}

function validate(form, today) {
  const errors = {}
  if (form.type !== 'Lost' && form.type !== 'Found') errors.type = 'Pilih tipe laporan.'
  if (!form.title.trim()) errors.title = 'Nama barang wajib diisi.'
  if (!form.category) errors.category = 'Pilih kategori barang.'
  if (!form.location.trim()) errors.location = 'Lokasi di kampus wajib diisi.'
  if (!form.color.trim()) errors.color = 'Warna barang wajib diisi.'
  if (!form.date) errors.date = 'Tanggal kejadian wajib diisi.'
  else if (form.date > today) errors.date = 'Tanggal kejadian tidak boleh di masa depan.'
  if (!/^\d{2}:\d{2}$/.test(form.estimated_time)) errors.estimated_time = 'Perkiraan jam kejadian wajib diisi.'
  if (!form.description.trim()) errors.description = 'Deskripsi barang wajib diisi.'
  if (form.image_url.trim() && !/^https?:\/\/\S+$/i.test(form.image_url.trim())) {
    errors.image_url = 'URL foto harus diawali http:// atau https://.'
  }
  if (!isWithinCampusBounds(form.latitude, form.longitude)) {
    errors.map = `Titik pin berada di luar batas area Kampus UNKLAB (maksimal ${CAMPUS_MAX_RADIUS_METERS} m dari pusat kampus).`
  }
  return errors
}

export default function CreateReportPage({ user, onLogout, search }) {
  const today = toLocalDate(new Date())
  const [form, setForm] = useState(() => ({
    type: getTypeFromSearch(search),
    title: '',
    category: '',
    location: '',
    color: '',
    date: today,
    estimated_time: '',
    description: '',
    image_url: '',
    latitude: CAMPUS_CENTER.lat,
    longitude: CAMPUS_CENTER.lng,
  }))
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const nextType = getTypeFromSearch(search)
    setForm((prev) => (prev.type === nextType ? prev : { ...prev, type: nextType }))
  }, [search])

  const selectedType = TYPE_OPTIONS.find((t) => t.value === form.type)

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('')
      return undefined
    }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'location') {
        const coords = getCoordinatesForLocation(value.trim())
        next.latitude = coords.lat
        next.longitude = coords.lng
      }
      return next
    })
    if (errors[field] || (field === 'location' && errors.map)) {
      setErrors((prev) => ({ ...prev, [field]: undefined, ...(field === 'location' ? { map: undefined } : {}) }))
    }
  }

  function submit(e) {
    e.preventDefault()
    setServerError('')
    const found = validate(form, today)
    if (errors.image) found.image = errors.image
    setErrors(found)
    if (Object.keys(found).length) {
      setServerError('Periksa kembali isian yang ditandai sebelum mengirim laporan.')
      return
    }
    setReviewOpen(true)
  }

  async function publishReport() {
    setServerError('')
    setLoading(true)
    try {
      const imageUrl = imageFile
        ? await api.uploadReportImage(imageFile, user.id)
        : form.image_url.trim() || null
      await api.createReport({
        type: form.type,
        title: form.title.trim(),
        category: form.category,
        location: form.location.trim(),
        color: form.color.trim(),
        description: form.description.trim(),
        reported_at: toLocalDateTime(form.date, form.estimated_time),
        image_url: imageUrl,
        latitude: form.latitude,
        longitude: form.longitude,
      })
      showToast('Laporan diterbitkan dan Smart Matching mulai mencocokkan kandidat!', 'success')
      navigate('/app/my-reports')
    } catch (err) {
      setServerError(err.message)
      setLoading(false)
    }
  }

  const fieldError = (field) =>
    errors[field] ? (
      <small id={`${field}-error`} className="sq-field-error">
        {errors[field]}
      </small>
    ) : null

  const a11y = (field) => ({
    'aria-invalid': errors[field] ? 'true' : undefined,
    'aria-describedby': errors[field] ? `${field}-error` : undefined,
  })

  return (
    <div className="sq-page">
      <AppNavbar user={user} onLogout={onLogout} />

      <main className="sq-container">
        <section className="sq-cta-banner">
          <img src="/figma/cta-wave.png" alt="" className="sq-banner-wave" aria-hidden="true" />
          <div className="sq-banner-dots" aria-hidden="true" />
          <div className="sq-banner-tint" aria-hidden="true" />
          <div className="sq-cta-content">
            <div className="sq-cta-logo">
              <img src="/figma/logo-cube.svg" alt="" width="44" height="50" />
            </div>
            <span className="sq-kicker-pill">LAPORAN BARU</span>
            <h1>Buat Laporan Barang</h1>
            <p>
              Ceritakan barang yang hilang atau yang Anda temukan di lingkungan kampus UNKLAB. Laporan langsung tampil di dashboard komunitas.
            </p>
          </div>
        </section>

        <section className="sq-login-shell">
          <form className="sq-form-box" onSubmit={submit} noValidate aria-label="Formulir laporan barang">
            {serverError && (
              <div className="sq-form-error" role="alert">
                {serverError}
              </div>
            )}

            <fieldset className="sq-input-card sq-fieldset">
              <legend className="sq-input-label">
                Tipe Laporan <span className="sq-required" aria-hidden="true">*</span>
              </legend>
              <div className="sq-type-toggle" role="radiogroup" aria-label="Tipe laporan">
                {TYPE_OPTIONS.map((opt) => (
                  <label key={opt.value} className={`sq-type-option ${form.type === opt.value ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value={opt.value}
                      checked={form.type === opt.value}
                      onChange={() => update('type', opt.value)}
                    />
                    <b>{opt.label}</b>
                    <small>{opt.hint}</small>
                  </label>
                ))}
              </div>
              <small className="sq-field-hint">
                Status awal laporan: <b>{selectedType.status}</b>
              </small>
            </fieldset>

            <div className="sq-form-row">
              <label className="sq-input-card">
                <span className="sq-input-label">
                  Nama Barang <span className="sq-required" aria-hidden="true">*</span>
                </span>
                <div className="sq-input-underline">
                  <input
                    value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                    placeholder="Contoh: Dompet kulit hitam"
                    maxLength={120}
                    required
                    {...a11y('title')}
                  />
                </div>
                {fieldError('title')}
              </label>

              <label className="sq-input-card">
                <span className="sq-input-label">
                  Kategori <span className="sq-required" aria-hidden="true">*</span>
                </span>
                <div className="sq-input-underline">
                  <select
                    className="sq-form-select"
                    value={form.category}
                    onChange={(e) => update('category', e.target.value)}
                    required
                    {...a11y('category')}
                  >
                    <option value="" disabled>
                      Pilih kategori
                    </option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldError('category')}
              </label>
            </div>

            <div className="sq-form-row">
              <label className="sq-input-card">
                <span className="sq-input-label">
                  Warna Barang <span className="sq-required" aria-hidden="true">*</span>
                </span>
                <div className="sq-input-underline">
                  <input
                    value={form.color}
                    onChange={(e) => update('color', e.target.value)}
                    placeholder="Contoh: hitam dengan garis merah"
                    maxLength={100}
                    required
                    {...a11y('color')}
                  />
                </div>
                {fieldError('color')}
              </label>

              <label className="sq-input-card">
                <span className="sq-input-label">
                  Perkiraan Jam Kejadian <span className="sq-required" aria-hidden="true">*</span>
                </span>
                <div className="sq-input-underline">
                  <input
                    type="time"
                    value={form.estimated_time}
                    onChange={(e) => update('estimated_time', e.target.value)}
                    required
                    {...a11y('estimated_time')}
                  />
                </div>
                <small className="sq-field-hint">Masukkan waktu perkiraan barang hilang atau ditemukan.</small>
                {fieldError('estimated_time')}
              </label>
            </div>

            <div className="sq-form-row">
              <label className="sq-input-card">
                <span className="sq-input-label">
                  Lokasi di Kampus <span className="sq-required" aria-hidden="true">*</span>
                </span>
                <div className="sq-input-underline">
                  <select
                    className="sq-form-select"
                    value={form.location}
                    onChange={(e) => update('location', e.target.value)}
                    required
                    {...a11y('location')}
                  >
                    <option value="" disabled>
                      Pilih lokasi di kampus
                    </option>
                    {LOCATIONS.map((l) => (
                      <option key={l} value={l}>
                        {CAMPUS_LOCATIONS[l]?.label || l}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldError('location')}
              </label>

              <label className="sq-input-card">
                <span className="sq-input-label">
                  Tanggal Kejadian <span className="sq-required" aria-hidden="true">*</span>
                </span>
                <div className="sq-input-underline">
                  <input
                    type="date"
                    value={form.date}
                    max={today}
                    onChange={(e) => update('date', e.target.value)}
                    required
                    {...a11y('date')}
                  />
                </div>
                {fieldError('date')}
              </label>
            </div>

            <div className="sq-input-card">
              <span className="sq-input-label">Titik Lokasi di Peta Kampus</span>
              <GoogleMapPin
                lat={form.latitude}
                lng={form.longitude}
                title={form.title.trim() || form.location.trim() || 'Kampus UNKLAB'}
                subtitle={form.location.trim()}
                type={form.type}
                height={240}
                interactive
                onSelect={({ lat, lng }) => {
                  if (!isWithinCampusBounds(lat, lng)) {
                    const dist = Math.round(distanceFromCampusCenter(lat, lng))
                    setErrors((prev) => ({
                      ...prev,
                      map: `Pin di luar batas kampus (${dist} m dari pusat UNKLAB, batas maks. ${CAMPUS_MAX_RADIUS_METERS} m). Pilih titik di dalam area kampus.`,
                    }))
                    return
                  }
                  const nearestLocation = findNearestCampusLocation(lat, lng)
                  setForm((prev) => ({
                    ...prev,
                    location: nearestLocation,
                    latitude: lat,
                    longitude: lng,
                  }))
                  setErrors((prev) => ({ ...prev, location: undefined, map: undefined }))
                }}
              />
              <small className="sq-field-hint">
                Pilih lokasi lalu klik peta untuk menggeser pin. Pin wajib berada di dalam batas area Kampus UNKLAB.
              </small>
              {errors.map && (
                <small className="sq-field-error" role="alert">
                  {errors.map}
                </small>
              )}
            </div>

            <label className="sq-input-card">
              <span className="sq-input-label">
                Deskripsi Detail <span className="sq-required" aria-hidden="true">*</span>
              </span>
              <div className="sq-input-underline">
                <textarea
                  className="sq-form-textarea"
                  rows={5}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Ciri umum saja. Ciri khusus simpan untuk verifikasi bukti klaim. Jangan tulis nomor identitas atau telepon lengkap."
                  maxLength={1000}
                  required
                  {...a11y('description')}
                />
              </div>
              <small className="sq-field-hint">
                {form.description.length}/1000 karakter · Jangan tulis nomor identitas lengkap di deskripsi publik.
              </small>
              {fieldError('description')}
            </label>

            <div className="sq-input-card">
              <span className="sq-input-label">
                Foto Barang <span className="sq-optional">(opsional)</span>
              </span>
              <div className="sq-file-input-wrap">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Pilih foto barang"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    if (
                      file &&
                      (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
                        file.size > 5 * 1024 * 1024)
                    ) {
                      setImageFile(null)
                      setErrors((prev) => ({
                        ...prev,
                        image:
                          file.size > 5 * 1024 * 1024
                            ? 'Ukuran foto maksimal 5 MB.'
                            : 'Foto harus berformat JPG, PNG, atau WebP.',
                      }))
                      e.target.value = ''
                      return
                    }
                    setErrors((prev) => ({ ...prev, image: undefined }))
                    setImageFile(file)
                  }}
                />
              </div>
              <small className="sq-field-hint">
                Format JPG, PNG, atau WebP · maksimal 5 MB. Jangan unggah foto kartu identitas utuh tanpa menyamarkan nomornya.
              </small>
              {errors.image && (
                <small className="sq-field-error" role="alert">
                  {errors.image}
                </small>
              )}
              <label className="sq-image-url-field">
                <span className="sq-field-hint">Atau gunakan URL foto</span>
                <div className="sq-input-underline">
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => update('image_url', e.target.value)}
                    placeholder="https://contoh.com/foto-barang.jpg"
                    {...a11y('image_url')}
                  />
                </div>
                {fieldError('image_url')}
              </label>
              {(imagePreview || form.image_url) && (
                <div className="sq-image-upload-preview">
                  <img
                    src={imagePreview || form.image_url}
                    alt={`Pratinjau ${form.title || 'foto barang'}`}
                  />
                  <div className="sq-image-upload-actions">
                    <button
                      type="button"
                      className="sq-btn sq-btn-outline"
                      onClick={() => setPreviewOpen(true)}
                    >
                      Lihat Pratinjau
                    </button>
                    {imageFile && (
                      <button
                        type="button"
                        className="sq-btn sq-btn-outline"
                        onClick={() => setImageFile(null)}
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sq-form-footer">
              <div className="sq-hero-actions">
                <button
                  type="submit"
                  className="sq-btn sq-btn-lime sq-submit-btn"
                  disabled={loading}
                  aria-busy={loading}
                >
                  Tinjau & Publikasikan →
                </button>
                <Link to="/app" className="sq-btn sq-btn-outline">
                  Batal
                </Link>
              </div>
              <div className="sq-demo-pill">
                <span>Kolom bertanda</span>
                <b>*</b>
                <span>wajib diisi · Nomor kontak tersimpan privat dan tidak tampil di halaman publik.</span>
              </div>
            </div>
          </form>
        </section>
      </main>

      <footer className="sq-footer">
        <div className="sq-footer-inner">
          <div className="sq-footer-bottom">
            <div className="sq-footer-contacts">
              <div className="sq-contact-pill">
                <img src="/figma/icon-mail.svg" alt="" width="22" height="22" />
                <span>{user.email}</span>
              </div>
              <div className="sq-contact-pill">
                <img src="/figma/icon-location.svg" alt="" width="22" height="22" />
                <span>Portal Mahasiswa Universitas Klabat</span>
              </div>
            </div>
            <p className="sq-copyright">© 2026 Lost and Found UNKLAB · Menemukan jalan pulang.</p>
          </div>
        </div>
      </footer>
      {previewOpen && (imagePreview || form.image_url) && (
        <ReportImagePreview
          imageUrl={imagePreview || form.image_url}
          title={form.title.trim() || 'barang'}
          onClose={() => setPreviewOpen(false)}
        />
      )}
      {reviewOpen && (
        <ReportReviewModal
          report={{
            ...form,
            status: selectedType.status,
          }}
          imageUrl={imagePreview || form.image_url.trim()}
          loading={loading}
          error={serverError}
          onClose={() => !loading && setReviewOpen(false)}
          onPublish={publishReport}
        />
      )}
    </div>
  )
}
