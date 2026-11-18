import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { requestNotificationsRefresh } from '../lib/notifications.js'
import { showToast } from '../lib/toast.js'
import { Link } from '../router.jsx'
import AppNavbar from '../components/layout/AppNavbar.jsx'
import AppFooter from '../components/layout/AppFooter.jsx'

const PHONE_PATTERN = /^(\+62|62|0)8[0-9]{7,12}$/
const cleanPhone = (value) => value.replace(/[\s().-]/g, '')

// Tampilkan +6281234567890 sebagai 0812-3456-7890 agar mudah dibaca.
function displayPhone(phone) {
  if (!phone) return ''
  const local = phone.replace(/^\+62/, '0')
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3')
}

export default function ProfilePage({ user, onLogout, onUserChange }) {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [formError, setFormError] = useState('')
  const [saved, setSaved] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoadError('')
    api
      .profile()
      .then((data) => {
        setProfile(data.profile)
        setName(data.profile.name)
        setPhone(displayPhone(data.profile.phone))
        setStats((s) => ({ ...s, unread: data.unread_notifications ?? 0 }))
      })
      .catch((e) => setLoadError(e.message))
    // Statistik pendukung; kegagalannya tidak menghalangi form profil.
    api.myReports().then(({ reports }) => setStats((s) => ({ ...s, reports: reports.length }))).catch(() => {})
    api.myClaims().then(({ claims }) => setStats((s) => ({ ...s, claims: claims.length }))).catch(() => {})
  }

  useEffect(load, [])

  async function submit(e) {
    e.preventDefault()
    setSaved('')
    const trimmedName = name.trim().replace(/\s+/g, ' ')
    const rawPhone = cleanPhone(phone)
    if (trimmedName.length < 3 || trimmedName.length > 80) return setFormError('Nama wajib diisi (3–80 karakter).')
    if (rawPhone && !PHONE_PATTERN.test(rawPhone))
      return setFormError('Nomor telepon tidak valid. Gunakan format 08xxxxxxxxxx atau +628xxxxxxxxxx.')
    setFormError('')
    setSaving(true)
    try {
      const data = await api.updateProfile({ name: trimmedName, phone: rawPhone })
      setProfile(data.profile)
      setName(data.profile.name)
      setPhone(displayPhone(data.profile.phone))
      setSaved('Profil berhasil disimpan.')
      showToast('Pengaturan kontak dan profil berhasil disimpan.', 'success')
      setStats((s) => ({ ...s, unread: data.unread_notifications ?? s?.unread }))
      requestNotificationsRefresh()
      onUserChange?.({ id: data.profile.id, name: data.profile.name, email: data.profile.email, role: data.profile.role })
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const displayUser = profile ?? user
  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'
  const dirty = profile && (name.trim() !== profile.name || cleanPhone(phone) !== cleanPhone(displayPhone(profile.phone)))

  return (
    <div className="sq-page">
      <AppNavbar user={user} onLogout={onLogout} active="profile" />

      <main className="sq-container">
        <section className="sq-dash-hero">
          <img src="/figma/banner-wave-3.png" alt="" className="sq-banner-wave" aria-hidden="true" />
          <div className="sq-banner-dots" aria-hidden="true" />
          <div className="sq-banner-tint" aria-hidden="true" />
          <div className="sq-dash-hero-grid">
            <div className="sq-dash-welcome">
              <span className="sq-kicker-pill">PROFIL MAHASISWA</span>
              <h1>
                {displayUser.name}
                <br />
                <span>Akun Lost and Found UNKLAB.</span>
              </h1>
              <p>Kelola nama tampilan dan nomor telepon privat Anda. Nomor telepon tidak pernah ditampilkan di laporan publik.</p>
            </div>
            <div className="sq-dash-highlight">
              <div className="sq-profile-avatar" aria-hidden="true">
                {displayUser.name
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((x) => x[0].toUpperCase())
                  .join('')}
              </div>
              <p>Peran akun</p>
              <strong className="sq-profile-role">Mahasiswa</strong>
              <small>{displayUser.email}</small>
            </div>
          </div>
        </section>

        <section className="sq-dash-stats" aria-label="Ringkasan aktivitas akun">
          <article className="sq-stat-card">
            <p>Laporan saya</p>
            <strong>{stats?.reports ?? '—'}</strong>
            <Link to="/app/my-reports" className="sq-stat-link">Kelola laporan ↗</Link>
          </article>
          <article className="sq-stat-card">
            <p>Klaim diajukan</p>
            <strong>{stats?.claims ?? '—'}</strong>
            <Link to="/app/my-claims" className="sq-stat-link">Lihat klaim ↗</Link>
          </article>
          <article className="sq-stat-card">
            <p>Notifikasi belum dibaca</p>
            <strong>{stats?.unread ?? '—'}</strong>
            <Link to="/app/notifications" className="sq-stat-link">Buka notifikasi ↗</Link>
          </article>
        </section>

        <section className="sq-section">
          <div className="sq-dash-toolbar">
            <div>
              <span className="sq-kicker-pill">DATA AKUN</span>
              <h2>Informasi & Kontak Privat</h2>
            </div>
          </div>

          {loadError ? (
            <div className="sq-state error">
              <b>{loadError}</b>
              <button type="button" className="sq-btn sq-btn-lime" onClick={load}>
                Coba lagi
              </button>
            </div>
          ) : !profile ? (
            <div className="sq-state">Memuat profil Anda…</div>
          ) : (
            <div className="sq-profile-grid">
              <dl className="sq-profile-facts">
                <div>
                  <dt>Email kampus</dt>
                  <dd>{profile.email}</dd>
                </div>
                <div>
                  <dt>Peran</dt>
                  <dd>Mahasiswa</dd>
                </div>
                <div>
                  <dt>Bergabung sejak</dt>
                  <dd>{joined}</dd>
                </div>
                <div>
                  <dt>Nomor telepon privat</dt>
                  <dd>{profile.phone ? displayPhone(profile.phone) : 'Belum diisi'}</dd>
                </div>
              </dl>

              <form className="sq-form-box sq-profile-form" onSubmit={submit} noValidate>
                {formError && (
                  <div className="sq-form-error" role="alert">
                    {formError}
                  </div>
                )}
                {saved && !dirty && (
                  <p className="sq-form-success" role="status">
                    {saved}
                  </p>
                )}

                <label className="sq-input-card">
                  <span className="sq-input-label">Nama lengkap</span>
                  <div className="sq-input-underline">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      maxLength={80}
                      placeholder="Nama sesuai kartu mahasiswa"
                    />
                  </div>
                </label>

                <label className="sq-input-card">
                  <span className="sq-input-label">Nomor telepon privat</span>
                  <div className="sq-input-underline">
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={20}
                      placeholder="0812-3456-7890"
                      aria-describedby="phone-privacy"
                    />
                  </div>
                  <span id="phone-privacy" className="sq-field-hint">
                    Privat — hanya terlihat oleh Anda. Tidak ditampilkan di kartu laporan, detail laporan, atau aktivitas
                    publik. Kosongkan untuk menghapus.
                  </span>
                </label>

                <div className="sq-form-actions">
                  <button type="submit" className="sq-btn sq-btn-lime" disabled={saving || !dirty}>
                    {saving ? 'Menyimpan…' : 'Simpan profil'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </main>

      <AppFooter user={user} />
    </div>
  )
}
