import { useState } from 'react'
import { api } from '../lib/api.js'
import { Link, navigate } from '../router.jsx'
import GoogleMapPin from '../components/maps/GoogleMapPin.jsx'
import { CAMPUS_CENTER, CAMPUS_LOCATION_NAMES, getCoordinatesForLocation } from '../lib/campusLocations.js'

const CATEGORIES = ['Elektronik', 'Aksesori', 'Kunci', 'Dokumen/Buku', 'Perlengkapan', 'Pakaian', 'Lainnya']
const LOCATIONS = CAMPUS_LOCATION_NAMES

const pad = (n) => String(n).padStart(2, '0')
const toLocalDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const toLocalTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

const TYPE_OPTIONS = [
  { value: 'Lost', label: 'Barang Hilang (Lost)', hint: 'Saya kehilangan barang ini', status: 'Masih dicari' },
  { value: 'Found', label: 'Barang Ditemukan (Found)', hint: 'Saya menemukan barang ini', status: 'Menunggu pemilik' },
]

function validate(form, today) {
  const errors = {}
  if (form.type !== 'Lost' && form.type !== 'Found') errors.type = 'Pilih tipe laporan.'
  if (!form.title.trim()) errors.title = 'Nama barang wajib diisi.'
  if (!form.category) errors.category = 'Pilih kategori barang.'
  if (!form.location.trim()) errors.location = 'Lokasi di kampus wajib diisi.'
  if (!form.date) errors.date = 'Tanggal kejadian wajib diisi.'
  else if (form.date > today) errors.date = 'Tanggal kejadian tidak boleh di masa depan.'
  if (!form.description.trim()) errors.description = 'Deskripsi barang wajib diisi.'
  if (form.image_url.trim() && !/^https?:\/\/\S+$/i.test(form.image_url.trim())) errors.image_url = 'URL foto harus diawali http:// atau https://.'
  return errors
}

export default function CreateReportPage({ user, onLogout }) {
  const today = toLocalDate(new Date())
  const [form, setForm] = useState({
    type: 'Lost',
    title: '',
    category: '',
    location: '',
    date: today,
    description: '',
    image_url: '',
    latitude: CAMPUS_CENTER.lat,
    longitude: CAMPUS_CENTER.lng,
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const initials = user.name.split(' ').map((x) => x[0]).join('')
  const selectedType = TYPE_OPTIONS.find((t) => t.value === form.type)

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
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function submit(e) {
    e.preventDefault()
    setServerError('')
    const found = validate(form, today)
    setErrors(found)
    if (Object.keys(found).length) {
      setServerError('Periksa kembali isian yang ditandai sebelum mengirim laporan.')
      return
    }
    setLoading(true)
    try {
      await api.createReport({
        type: form.type,
        title: form.title.trim(),
        category: form.category,
        location: form.location.trim(),
        description: form.description.trim(),
        reported_at: `${form.date}T${toLocalTime(new Date())}`,
        image_url: form.image_url.trim() || null,
        latitude: form.latitude,
        longitude: form.longitude,
      })
      navigate('/app')
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
      <header className="sq-navbar">
        <div className="sq-navbar-inner">
          <Link to="/" className="sq-brand" aria-label="Beranda Lost and Found UNKLAB">
            <span className="sq-brand-box">
              <img src="/figma/logo-cube.svg" alt="" width="38" height="43" />
            </span>
            <span className="sq-brand-text">
              Lost and Found<span>.</span>
              <small>UNKLAB</small>
            </span>
          </Link>

          <nav className="sq-nav-links" aria-label="Navigasi Buat Laporan">
            <Link to="/app" className="sq-nav-item">← Kembali ke Dashboard</Link>
            <span className="sq-nav-item active" aria-current="page">Buat Laporan</span>
          </nav>

          <div className="sq-account-bar">
            <div className="sq-user-chip">
              <span className="sq-avatar">{initials}</span>
              <div className="sq-user-meta">
                <b>{user.name}</b>
                <small>Mahasiswa</small>
              </div>
            </div>
            <button type="button" className="sq-btn sq-btn-outline sq-logout-btn" onClick={onLogout}>
              Keluar ↗
            </button>
          </div>
        </div>
      </header>

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
                  Lokasi di Kampus <span className="sq-required" aria-hidden="true">*</span>
                </span>
                <div className="sq-input-underline">
                  <input
                    value={form.location}
                    onChange={(e) => update('location', e.target.value)}
                    placeholder="Pilih atau ketik lokasi"
                    list="campus-locations"
                    required
                    {...a11y('location')}
                  />
                  <datalist id="campus-locations">
                    {LOCATIONS.map((l) => (
                      <option key={l} value={l} />
                    ))}
                  </datalist>
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
              <span className="sq-input-label">
                Titik Lokasi di Peta Kampus
              </span>
              <GoogleMapPin
                lat={form.latitude}
                lng={form.longitude}
                title={form.title.trim() || form.location.trim() || 'Kampus UNKLAB'}
                subtitle={form.location.trim()}
                type={form.type}
                height={240}
                interactive
                onSelect={({ lat, lng }) =>
                  setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))
                }
              />
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
                  placeholder="Ciri khusus, warna, kondisi, atau instruksi pengambilan. Jangan tulis nomor telepon atau bukti kepemilikan rahasia."
                  maxLength={1000}
                  required
                  {...a11y('description')}
                />
              </div>
              <small className="sq-field-hint">{form.description.length}/1000 karakter</small>
              {fieldError('description')}
            </label>

            <label className="sq-input-card">
              <span className="sq-input-label">
                URL Foto <span className="sq-optional">(opsional)</span>
              </span>
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

            <div className="sq-form-footer">
              <div className="sq-hero-actions">
                <button type="submit" className="sq-btn sq-btn-lime sq-submit-btn" disabled={loading} aria-busy={loading}>
                  {loading ? 'Menyimpan laporan…' : 'Kirim Laporan →'}
                </button>
                <Link to="/app" className="sq-btn sq-btn-outline">
                  Batal
                </Link>
              </div>
              <div className="sq-demo-pill">
                <span>Kolom bertanda</span>
                <b>*</b>
                <span>wajib diisi · Data kontak pribadi tidak ditampilkan di kartu publik.</span>
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
    </div>
  )
}
