import { useState } from 'react'
import { Link } from '../router.jsx'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('student@unklab.ac.id')
  const [password, setPassword] = useState('unklab123')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError('Email dan password wajib diisi.')
    setLoading(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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

          <nav className="sq-nav-links" aria-label="Navigasi Halaman Masuk">
            <Link to="/" className="sq-nav-item">← Kembali ke Beranda</Link>
          </nav>

          <div className="sq-nav-cta">
            <Link to="/" className="sq-btn sq-btn-outline">
              Beranda
            </Link>
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
              <img src="/figma/logo-cube.svg" alt="" width="44" height="50" />
            </div>
            <h1>Selamat Datang di Lost and Found UNKLAB</h1>
            <p>
              Masuk menggunakan email mahasiswa Anda untuk melihat laporan terbaru, mencari barang yang hilang, dan membantu barang kembali kepada pemiliknya.
            </p>
          </div>
        </section>

        {/* Form Container matching Figma Node 37:425 */}
        <section className="sq-login-shell">
          <form className="sq-form-box" onSubmit={submit} noValidate>
            {error && (
              <div className="sq-form-error" role="alert">
                {error}
              </div>
            )}

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
                {loading ? 'Sedang masuk…' : 'Masuk ke Dashboard →'}
              </button>

              <div className="sq-demo-pill">
                <span>Akun Demo Mahasiswa:</span>
                <b>student@unklab.ac.id</b>
                <span>·</span>
                <span>Password:</span>
                <b>unklab123</b>
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
