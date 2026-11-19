import { useEffect, useState } from 'react'
import { Link, navigate } from '../router.jsx'
import BrandLogo from '../components/layout/BrandLogo.jsx'

export default function LoginPage({ onLogin, onRegister, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('student@unklab.ac.id')
  const [password, setPassword] = useState('unklab123')

  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMode(initialMode)
    setError('')
  }, [initialMode])

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
    const targetUrl = nextMode === 'register' ? '/register' : '/login'
    if (window.location.pathname !== targetUrl) {
      navigate(targetUrl)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setError('')

    if (mode === 'login') {
      if (!email.trim() || !password) {
        return setError('Email dan password wajib diisi.')
      }
      setLoading(true)
      try {
        await onLogin(email.trim(), password)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
      return
    }

    // Mode Registrasi Mahasiswa Baru
    const trimmedName = regName.trim()
    const trimmedEmail = regEmail.trim().toLowerCase()
    const trimmedPhone = regPhone.trim()

    if (trimmedName.length < 3) {
      return setError('Nama lengkap mahasiswa wajib diisi (minimal 3 karakter).')
    }
    if (!trimmedEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
      return setError('Masukkan alamat email mahasiswa yang valid.')
    }
    if (regPassword.length < 6) {
      return setError('Password minimal terdiri dari 6 karakter.')
    }
    if (regPassword !== regConfirm) {
      return setError('Konfirmasi password tidak cocok dengan password yang dimasukkan.')
    }
    if (trimmedPhone && !/^(\+62|62|0)8[0-9]{7,12}$/.test(trimmedPhone.replace(/[\s().-]/g, ''))) {
      return setError('Nomor telepon tidak valid. Gunakan format 08xxxxxxxxxx atau +628xxxxxxxxxx.')
    }

    setLoading(true)
    try {
      await onRegister({
        name: trimmedName,
        email: trimmedEmail,
        password: regPassword,
        phone: trimmedPhone,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isRegister = mode === 'register'

  return (
    <div className="sq-page">
      <header className="sq-navbar">
        <div className="sq-navbar-inner">
          <BrandLogo to="/" ariaLabel="Beranda Lost and Found UNKLAB" />

          <nav className="sq-nav-links" aria-label="Navigasi Halaman Masuk">
            <Link to="/" className="sq-nav-item">
              ← Kembali ke Beranda
            </Link>
          </nav>

          <div className="sq-nav-cta">
            <button
              type="button"
              className="sq-btn sq-btn-outline"
              onClick={() => switchMode(isRegister ? 'login' : 'register')}
            >
              {isRegister ? 'Masuk Akun' : '+ Buat Akun Baru'}
            </button>
          </div>
        </div>
      </header>

      <main className="sq-container sq-login-container">
        {/* Banner Header matching Figma Contact Section (Node 37:504) */}
        <section className="sq-cta-banner sq-login-banner">
          <img src="/figma/cta-wave.png" alt="" className="sq-banner-wave" aria-hidden="true" />
          <div className="sq-banner-dots" aria-hidden="true" />
          <div className="sq-banner-tint" aria-hidden="true" />
          <div className="sq-cta-content">
            <div className="sq-cta-logo">
              <img src="/figma/logo-cube.svg" alt="" width="60" height="60" />
            </div>
            <h1>
              {isRegister
                ? 'Buat Akun Mahasiswa Lost and Found UNKLAB'
                : 'Selamat Datang di Lost and Found UNKLAB'}
            </h1>
            <p>
              {isRegister
                ? 'Daftarkan akun mahasiswa Anda untuk mulai melaporkan barang hilang atau temuan, menggunakan AI Smart Matching, dan berkoordinasi klaim secara aman.'
                : 'Masuk menggunakan email mahasiswa Anda untuk melihat laporan terbaru, mencari barang yang hilang, dan membantu barang kembali kepada pemiliknya.'}
            </p>
          </div>
        </section>

        {/* Form Container matching Figma Node 37:425 */}
        <section className="sq-login-shell">
          <form className="sq-form-box" onSubmit={submit} noValidate>
            <div className="sq-input-card">
              <span className="sq-input-label">Mode Akses Portal Mahasiswa</span>
              <div className="sq-type-toggle" role="tablist" aria-label="Pilih masuk atau daftar akun mahasiswa">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isRegister}
                  className={`sq-type-option${!isRegister ? ' active' : ''}`}
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => switchMode('login')}
                >
                  <b>Masuk Akun Mahasiswa</b>
                  <small>Gunakan akun mahasiswa yang sudah terdaftar</small>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isRegister}
                  className={`sq-type-option${isRegister ? ' active' : ''}`}
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => switchMode('register')}
                >
                  <b>Buat Akun Baru Mahasiswa</b>
                  <small>Daftar akun baru khusus mahasiswa UNKLAB</small>
                </button>
              </div>
            </div>

            {error && (
              <div className="sq-form-error" role="alert">
                {error}
              </div>
            )}

            {!isRegister ? (
              <div className="sq-form-row">
                <label className="sq-input-card">
                  <span className="sq-input-label">Email Mahasiswa</span>
                  <div className="sq-input-underline">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      autoComplete="email"
                      placeholder="student@unklab.ac.id"
                    />
                  </div>
                </label>

                <label className="sq-input-card">
                  <span className="sq-input-label">Password</span>
                  <div className="sq-input-underline sq-password-wrap">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={show ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Masukkan password Anda"
                    />
                    <button
                      type="button"
                      className="sq-password-toggle"
                      onClick={() => setShow(!show)}
                      aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {show ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                  </div>
                </label>
              </div>
            ) : (
              <>
                <div className="sq-form-row">
                  <label className="sq-input-card">
                    <span className="sq-input-label">
                      Nama Lengkap Mahasiswa <span className="sq-required" aria-hidden="true">*</span>
                    </span>
                    <div className="sq-input-underline">
                      <input
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        type="text"
                        autoComplete="name"
                        maxLength={80}
                        placeholder="Contoh: Yoel Antariksa"
                        required
                      />
                    </div>
                    <small className="sq-field-hint">Nama tampilan pada laporan dan ruang klaim (3–80 karakter).</small>
                  </label>

                  <label className="sq-input-card">
                    <span className="sq-input-label">
                      Email Mahasiswa <span className="sq-required" aria-hidden="true">*</span>
                    </span>
                    <div className="sq-input-underline">
                      <input
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        type="email"
                        autoComplete="email"
                        placeholder="nama@student.unklab.ac.id"
                        required
                      />
                    </div>
                    <small className="sq-field-hint">Gunakan email mahasiswa aktif Anda untuk masuk ke portal.</small>
                  </label>
                </div>

                <div className="sq-form-row">
                  <label className="sq-input-card">
                    <span className="sq-input-label">
                      Password Baru <span className="sq-required" aria-hidden="true">*</span>
                    </span>
                    <div className="sq-input-underline sq-password-wrap">
                      <input
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        type={show ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Minimal 6 karakter"
                        required
                      />
                      <button
                        type="button"
                        className="sq-password-toggle"
                        onClick={() => setShow(!show)}
                        aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
                      >
                        {show ? 'Sembunyikan' : 'Tampilkan'}
                      </button>
                    </div>
                  </label>

                  <label className="sq-input-card">
                    <span className="sq-input-label">
                      Konfirmasi Password <span className="sq-required" aria-hidden="true">*</span>
                    </span>
                    <div className="sq-input-underline">
                      <input
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                        type={show ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Ulangi password baru Anda"
                        required
                      />
                    </div>
                  </label>
                </div>

                <label className="sq-input-card">
                  <span className="sq-input-label">
                    Nomor Telepon / WhatsApp <span className="sq-optional">(Opsional · Privat)</span>
                  </span>
                  <div className="sq-input-underline">
                    <input
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      type="tel"
                      autoComplete="tel"
                      placeholder="08xxxxxxxxxx atau +628xxxxxxxxxx"
                    />
                  </div>
                  <small className="sq-field-hint">
                    Nomor telepon bersifat privat (tidak pernah ditampilkan di kartu laporan publik) dan hanya dibagikan di ruang klaim bila kedua pihak menyetujui.
                  </small>
                </label>
              </>
            )}

            <div className="sq-input-card sq-access-card">
              <span className="sq-input-label">Akses Akun Mahasiswa UNKLAB</span>
              <div className="sq-check-grid">
                <div className="sq-check-item">
                  <span className="sq-checkbox checked">
                    <img src="/figma/icon-check.svg" alt="" width="16" height="16" />
                  </span>
                  <span>Pantau Laporan Barang Hilang & Temuan</span>
                </div>
                <div className="sq-check-item">
                  <span className="sq-checkbox checked">
                    <img src="/figma/icon-check.svg" alt="" width="16" height="16" />
                  </span>
                  <span>Filter Kategori & Titik Lokasi Kampus</span>
                </div>
                <div className="sq-check-item">
                  <span className="sq-checkbox checked">
                    <img src="/figma/icon-check.svg" alt="" width="16" height="16" />
                  </span>
                  <span>Status Transparan (Masih dicari / Menunggu pemilik)</span>
                </div>
                <div className="sq-check-item">
                  <span className="sq-checkbox checked">
                    <img src="/figma/icon-check.svg" alt="" width="16" height="16" />
                  </span>
                  <span>Privasi Terlindungi di Lingkungan Kampus</span>
                </div>
              </div>
            </div>

            <div className="sq-form-footer">
              <button className="sq-btn sq-btn-lime sq-submit-btn" disabled={loading}>
                {loading
                  ? isRegister
                    ? 'Membuat akun mahasiswa…'
                    : 'Sedang masuk…'
                  : isRegister
                    ? 'Buat Akun Mahasiswa & Masuk →'
                    : 'Masuk ke Dashboard →'}
              </button>

              {!isRegister ? (
                <>
                  <button
                    type="button"
                    className="sq-btn sq-btn-outline"
                    onClick={() => switchMode('register')}
                  >
                    Belum punya akun? Buat Akun Baru Mahasiswa
                  </button>
                  <div className="sq-demo-pill">
                    <span>Akun Demo Mahasiswa:</span>
                    <b>student@unklab.ac.id</b>
                    <span>·</span>
                    <span>Password:</span>
                    <b>unklab123</b>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="sq-btn sq-btn-outline"
                  onClick={() => switchMode('login')}
                >
                  Sudah punya akun? Masuk di sini
                </button>
              )}
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
                <span>student@unklab.ac.id</span>
              </div>
              <div className="sq-contact-pill">
                <img src="/figma/icon-location.svg" alt="" width="22" height="22" />
                <span>Kampus Universitas Klabat, Airmadidi</span>
              </div>
            </div>
            <p className="sq-copyright">
              © 2026 Lost and Found UNKLAB. Hal-hal baik selalu menemukan jalan.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
