import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { Link } from '../router.jsx'
import BrandLogo from '../components/layout/BrandLogo.jsx'

const services = [
  {
    icon: '/figma/icon-service-1.svg',
    title: 'Laporan Cepat & Terstruktur',
    text: 'Bagikan detail barang yang hilang atau ditemukan di area kampus lengkap dengan kategori, titik lokasi gedung, dan keterangan waktu secara terorganisir.',
    cta: 'Buat Laporan Baru',
  },
  {
    icon: '/figma/icon-service-2.svg',
    title: 'Pencocokan Lokasi & Kategori',
    text: 'Telusuri daftar laporan komunitas secara instan menggunakan pencarian pintar berdasarkan kategori barang, lokasi gedung UNKLAB, maupun status laporan.',
    cta: 'Jelajahi Laporan',
  },
  {
    icon: '/figma/icon-service-3.svg',
    title: 'Pengembalian Aman & Terverifikasi',
    text: 'Privasi mahasiswa selalu terjaga. Koordinasi klaim dan pengembalian dilakukan di lingkungan kampus tanpa menampilkan nomor telepon pribadi secara terbuka.',
    cta: 'Masuk ke Portal',
  },
]

const previewReports = [
  {
    id: 104,
    type: 'Found',
    title: 'AirPods Putih Generasi 3',
    category: 'Elektronik',
    location: 'Perpustakaan UNKLAB',
    status: 'Menunggu pemilik',
    description: 'Ditemukan di dekat meja baca lantai dua perpustakaan. Casing masih mulus dengan indikator lampu berfungsi normal, disimpan aman menunggu pemilik.',
  },
  {
    id: 103,
    type: 'Lost',
    title: 'Dompet Kulit Cokelat',
    category: 'Aksesori',
    location: 'Student Center',
    status: 'Masih dicari',
    description: 'Dompet lipat kulit warna cokelat tua berisi tanda pengenal mahasiswa. Terakhir terlihat saat jam istirahat siang di sekitar Student Center.',
  },
  {
    id: 102,
    type: 'Lost',
    title: 'Kunci Motor Honda',
    category: 'Kunci',
    location: 'Parkiran Fakultas',
    status: 'Masih dicari',
    description: 'Satu set kunci motor Honda dengan gantungan karet biru kecil. Kemungkinan terjatuh saat mengambil helm di area parkiran fakultas.',
  },
  {
    id: 101,
    type: 'Found',
    title: 'Tumbler Hijau Stainless',
    category: 'Perlengkapan',
    location: 'Cafeteria',
    status: 'Menunggu pemilik',
    description: 'Tumbler minum warna hijau ukuran 500ml tanpa label nama yang tertinggal di meja dekat kasir utama Cafeteria UNKLAB.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Laporkan dengan Mudah',
    text: 'Masuk dengan akun mahasiswa UNKLAB Anda, lalu catat informasi barang yang hilang atau ditemukan beserta titik lokasi dan waktu kejadian dalam hitungan menit.',
  },
  {
    number: '02',
    title: 'Temukan Kecocokan',
    text: 'Gunakan fitur pencarian real-time dan filter kategori (Lost / Found) di dashboard untuk memantau laporan terbaru dari seluruh penjuru kampus.',
  },
  {
    number: '03',
    title: 'Verifikasi Kepemilikan',
    text: 'Cocokkan ciri khusus barang secara aman melalui sistem klaim komunitas untuk memastikan setiap barang kembali kepada pemilik yang sah.',
  },
  {
    number: '04',
    title: 'Kembalikan dengan Aman',
    text: 'Atur pertemuan pengembalian di titik kampus yang disepakati seperti Student Center atau Perpustakaan, lalu perbarui status laporan.',
  },
]

const reasons = [
  {
    icon: '/figma/icon-why-1.svg',
    title: 'Khusus Civitas Mahasiswa UNKLAB',
    text: 'Seluruh laporan terhubung langsung dengan ekosistem mahasiswa Universitas Klabat sehingga informasi lebih akurat, relevan, dan terpercaya.',
  },
  {
    icon: '/figma/icon-why-2.svg',
    title: 'Kolaborasi Komunitas yang Peduli',
    text: 'Menggabungkan kepedulian antar-mahasiswa dalam satu papan informasi terpusat agar tidak ada lagi pengumuman barang hilang yang tercecer.',
  },
  {
    icon: '/figma/icon-why-3.svg',
    title: 'Privasi & Keamanan Terjaga',
    text: 'Kami tidak menampilkan nomor telepon pribadi atau bukti rahasia pada kartu publik, melindungi mahasiswa dari penyalahgunaan data.',
  },
  {
    icon: '/figma/icon-why-4.svg',
    title: 'Status Transparan & Real-Time',
    text: 'Setiap laporan memiliki label status yang jelas — mulai dari Masih dicari, Menunggu pemilik, hingga Sudah ditemukan.',
  },
]

const faqs = [
  {
    number: '01',
    question: 'Siapa saja yang dapat mengakses Lost & Found UNKLAB?',
    answer: 'Portal ini dirancang khusus untuk mahasiswa Universitas Klabat. Anda dapat masuk menggunakan akun mahasiswa (@unklab.ac.id) untuk melihat daftar lengkap dan mengelola laporan.',
  },
  {
    number: '02',
    question: 'Bagaimana cara melaporkan barang yang hilang atau ditemukan?',
    answer: 'Setelah masuk ke dashboard, klik tombol "+ Buat laporan", pilih tipe laporan (Barang Hilang atau Barang Ditemukan), isi lokasi kampus, kategori, serta deskripsi singkat.',
  },
  {
    number: '03',
    question: 'Apakah nomor kontak pribadi saya aman di portal ini?',
    answer: 'Sangat aman. Sesuai standar privasi kampus, kartu laporan publik tidak memajang nomor telepon pribadi maupun detail sensitif pemilik barang.',
  },
  {
    number: '04',
    question: 'Apa arti status "Masih dicari" dan "Menunggu pemilik"?',
    answer: '"Masih dicari" menandakan barang hilang yang belum ditemukan pemiliknya, sedangkan "Menunggu pemilik" menandakan barang temuan yang siap diklaim oleh pemilik sahnya.',
  },
  {
    number: '05',
    question: 'Di mana lokasi serah terima barang yang disarankan?',
    answer: 'Kami menyarankan titik ramai di dalam kampus UNKLAB seperti Student Center, lobi Perpustakaan, atau area Cafeteria pada jam operasional kampus.',
  },
  {
    number: '06',
    question: 'Apakah layanan Lost & Found UNKLAB ini dipungut biaya?',
    answer: 'Tidak. Portal ini 100% gratis sebagai inisiatif komunitas mahasiswa UNKLAB untuk saling menolong dan menjaga barang berharga di kampus.',
  },
]

const campusStats = [
  ['1.2K+', 'Laporan Komunitas'],
  ['86%', 'Barang Kembali'],
  ['24 Jam', 'Rata-rata Respons'],
  ['Student Center', 'Titik Temu Utama'],
  ['Perpustakaan', 'Zona Laporan Aktif'],
  ['Cafeteria', 'Area Pantauan'],
]

export default function LandingPage({ user }) {
  const [openFaq, setOpenFaq] = useState('01')
  const [reports, setReports] = useState(previewReports)
  const portalHref = user ? '/app' : '/login'

  useEffect(() => {
    let active = true
    api
      .publicReports()
      .then((res) => {
        if (active && Array.isArray(res?.reports) && res.reports.length > 0) {
          setReports(res.reports)
        }
      })
      .catch(() => {
        // Pertahankan previewReports jika API gagal dimuat
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="sq-page">
      <header className="sq-navbar">
        <div className="sq-navbar-inner">
          <BrandLogo to="/" ariaLabel="Beranda Lost and Found UNKLAB" />

          <nav className="sq-nav-links" aria-label="Navigasi Utama">
            <a href="#beranda" className="sq-nav-item active">Beranda</a>
            <a href="#layanan" className="sq-nav-item">Layanan</a>
            <a href="#laporan" className="sq-nav-item">Laporan</a>
            <a href="#cara-kerja" className="sq-nav-item">Cara Kerja</a>
            <a href="#keunggulan" className="sq-nav-item">Keunggulan</a>
            <a href="#faq" className="sq-nav-item">FAQ</a>
          </nav>

          <div className="sq-nav-cta">
            <Link to={portalHref} className="sq-btn sq-btn-lime">
              {user ? 'Buka Dashboard →' : 'Masuk Portal'}
            </Link>
          </div>
        </div>
      </header>

      <main className="sq-container">
        {/* HERO SECTION (Figma Node 29:5) */}
        <section id="beranda" className="sq-hero">
          <div className="sq-hero-dots" aria-hidden="true" />
          <div className="sq-hero-content">
            <h1>
              Lost and Found UNKLAB
              <br />
              <span>Temukan Kembali yang Berarti</span>
            </h1>

            <div className="sq-hero-audience" aria-label="Cakupan layanan komunitas">
              <span className="sq-audience-text">Untuk</span>
              <span className="sq-audience-pill">Mahasiswa UNKLAB</span>
              <span className="sq-audience-text">,</span>
              <span className="sq-audience-pill">Barang Hilang</span>
              <span className="sq-audience-text">,</span>
              <span className="sq-audience-pill">Barang Temuan</span>
              <span className="sq-audience-text">dan</span>
              <span className="sq-audience-pill">Komunitas Peduli</span>
            </div>

            <div className="sq-hero-actions">
              <a href="#laporan" className="sq-btn sq-btn-outline">
                Lihat Laporan Terbaru
              </a>
              <Link to={portalHref} className="sq-btn sq-btn-lime">
                {user ? 'Ke Dashboard Saya' : 'Mulai Mencari'}
              </Link>
            </div>
          </div>

          {/* Wireframe Mountain / Topographic Abstract Design (Figma Node 29:4) */}
          <div className="sq-hero-terrain" aria-hidden="true">
            <svg viewBox="0 0 1596 380" fill="none" preserveAspectRatio="none">
              <defs>
                <linearGradient id="terrainGlow" x1="798" y1="10" x2="798" y2="380" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#9EFF00" stopOpacity="0.55" />
                  <stop offset="55%" stopColor="#9EFF00" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#1A1A1A" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="terrainFill" x1="798" y1="30" x2="798" y2="380" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#263812" stopOpacity="0.48" />
                  <stop offset="100%" stopColor="#1A1A1A" stopOpacity="0.95" />
                </linearGradient>
              </defs>
              <path
                d="M0 380 L140 330 L270 305 L380 245 L465 268 L560 155 L635 190 L725 65 L798 115 L885 38 L975 162 L1045 128 L1145 235 L1235 215 L1340 295 L1460 335 L1596 380 Z"
                fill="url(#terrainFill)"
              />
              {[0, 14, 28, 42, 56, 70, 84, 98, 112, 126, 140, 154, 168].map((offset, idx) => (
                <path
                  key={offset}
                  d={`M${offset * 0.8} 380 L${140 + offset * 0.3} ${330 + offset * 0.28} L${270 - offset * 0.2} ${305 + offset * 0.42} L${380 + offset * 0.15} ${245 + offset * 0.65} L${465} ${268 + offset * 0.55} L${560} ${155 + offset * 0.95} L${635} ${190 + offset * 0.85} L${725} ${65 + offset * 1.35} L${798} ${115 + offset * 1.15} L${885} ${38 + offset * 1.45} L${975} ${162 + offset * 0.92} L${1045} ${128 + offset * 1.08} L${1145} ${235 + offset * 0.72} L${1235} ${215 + offset * 0.78} L${1340} ${295 + offset * 0.48} L${1460} ${335 + offset * 0.25} L${1596 - offset * 0.8} 380`}
                  stroke="url(#terrainGlow)"
                  strokeWidth={idx % 3 === 0 ? '1.3' : '0.8'}
                  opacity={1 - idx * 0.045}
                />
              ))}
            </svg>
          </div>
        </section>

        {/* TRUSTED BY / STATS BAR (Figma Node 29:202) */}
        <section className="sq-trust-bar" aria-label="Statistik dan titik lokasi kampus">
          <div className="sq-trust-pill">Dipercaya oleh 1.200+ Mahasiswa UNKLAB</div>
          <div className="sq-trust-grid">
            {campusStats.map(([value, label]) => (
              <div className="sq-trust-card" key={value}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* OUR SERVICES SECTION (Figma Node 29:237) */}
        <section id="layanan" className="sq-section">
          <div className="sq-section-banner">
            <img src="/figma/banner-wave-1.png" alt="" className="sq-banner-wave" aria-hidden="true" />
            <div className="sq-banner-dots" aria-hidden="true" />
            <div className="sq-banner-tint" aria-hidden="true" />
            <div className="sq-banner-text">
              <h2>Layanan Komunitas Kami</h2>
              <p>
                Ruang kolaboratif yang memudahkan mahasiswa melaporkan, melacak, dan mengembalikan barang berharga di lingkungan kampus.
              </p>
            </div>
          </div>

          <div className="sq-services-grid">
            {services.map((service) => (
              <article className="sq-service-card" key={service.title}>
                <div className="sq-service-top">
                  <div className="sq-icon-badge">
                    <img src={service.icon} alt="" width="40" height="40" />
                  </div>
                  <div className="sq-service-copy">
                    <h3>{service.title}</h3>
                    <p>{service.text}</p>
                  </div>
                </div>
                <Link to="/login" className="sq-btn sq-btn-card">
                  {service.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* WORKS / REPORTS PREVIEW SECTION (Figma Node 50:254) */}
        <section id="laporan" className="sq-section">
          <div className="sq-section-banner">
            <img src="/figma/banner-wave-2.png" alt="" className="sq-banner-wave" aria-hidden="true" />
            <div className="sq-banner-dots" aria-hidden="true" />
            <div className="sq-banner-tint" aria-hidden="true" />
            <div className="sq-banner-text">
              <h2>Laporan Terbaru Komunitas</h2>
              <p>
                Pantau laporan barang hilang dan barang temuan terkini yang dibagikan oleh rekan mahasiswa di sekitar kampus UNKLAB.
              </p>
            </div>
          </div>

          <div className="sq-works-grid">
            {reports.map((item) => {
              const isFound = item.type === 'Found'
              const typeClass = isFound ? 'found' : 'lost'
              const typeHeader = isFound ? 'Barang Ditemukan' : 'Barang Hilang'
              const typeLabel = isFound ? 'BARANG DITEMUKAN' : 'BARANG HILANG'

              return (
                <article className="sq-work-card" key={item.id}>
                  <div className="sq-work-header">
                    <span>
                      {typeHeader} · {item.location}
                    </span>
                    <em className={`sq-status-badge ${typeClass}`}>{item.status}</em>
                  </div>

                  <div className="sq-work-body">
                    <div className={`sq-work-visual ${typeClass}`}>
                      <div className="sq-visual-grid" aria-hidden="true" />
                      <div className="sq-visual-top">
                        <span className="sq-visual-tag">{typeLabel}</span>
                        <span className="sq-visual-code">#LF-{item.id}</span>
                      </div>
                      <div className="sq-visual-center">
                        <div className="sq-visual-orb">
                          <img
                            src={isFound ? '/figma/icon-service-2.svg' : '/figma/icon-service-1.svg'}
                            alt=""
                            width="36"
                            height="36"
                          />
                        </div>
                        <strong>{item.title}</strong>
                        <small>{item.status}</small>
                      </div>
                    </div>

                    <div className="sq-work-meta">
                      <div>
                        <h3>{item.title}</h3>
                        <div className="sq-work-pill">
                          {item.category} · {item.location}
                          {item.color ? ` · Warna: ${item.color}` : ''}
                        </div>
                      </div>
                      <Link
                        to={user && item.id < 100 ? `/app/reports/${item.id}` : portalHref}
                        className="sq-icon-action"
                        aria-label={`Lihat detail laporan ${item.title}`}
                      >
                        <img src="/figma/icon-arrow-up-right.svg" alt="" width="28" height="28" />
                      </Link>
                    </div>

                    <p className="sq-work-desc">{item.description}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* PROCESS SECTION (Figma Node 50:876) */}
        <section id="cara-kerja" className="sq-section">
          <div className="sq-section-banner">
            <img src="/figma/banner-wave-3.png" alt="" className="sq-banner-wave" aria-hidden="true" />
            <div className="sq-banner-dots" aria-hidden="true" />
            <div className="sq-banner-tint" aria-hidden="true" />
            <div className="sq-banner-text">
              <h2>Jalan Pulang bagi Setiap Barang</h2>
              <p>
                Empat tahapan terstruktur yang memastikan setiap laporan ditindaklanjuti secara transparan dan aman.
              </p>
            </div>
          </div>

          <div className="sq-process-grid">
            {steps.map((step) => (
              <article className="sq-process-card" key={step.number}>
                <div className="sq-process-head">
                  <span className="sq-process-num">{step.number}</span>
                  <div className="sq-process-title">
                    <h3>{step.title}</h3>
                  </div>
                </div>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* WHY CHOOSE US SECTION (Figma Node 44:360) */}
        <section id="keunggulan" className="sq-section">
          <div className="sq-section-banner">
            <img src="/figma/banner-wave-1.png" alt="" className="sq-banner-wave" aria-hidden="true" />
            <div className="sq-banner-dots" aria-hidden="true" />
            <div className="sq-banner-tint" aria-hidden="true" />
            <div className="sq-banner-text">
              <h2>Mengapa Lost and Found UNKLAB?</h2>
              <p>
                Dirancang mengikuti kebutuhan mahasiswa dengan mengutamakan kecepatan informasi, ketertiban data, dan keamanan privasi.
              </p>
            </div>
          </div>

          <div className="sq-why-grid">
            {reasons.map((reason) => (
              <article className="sq-why-card" key={reason.title}>
                <div className="sq-why-head">
                  <div className="sq-icon-badge">
                    <img src={reason.icon} alt="" width="40" height="40" />
                  </div>
                  <h3>{reason.title}</h3>
                </div>
                <p>{reason.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ SECTION (Figma Node 37:256) */}
        <section id="faq" className="sq-section">
          <div className="sq-section-banner">
            <img src="/figma/banner-wave-3.png" alt="" className="sq-banner-wave" aria-hidden="true" />
            <div className="sq-banner-dots" aria-hidden="true" />
            <div className="sq-banner-tint" aria-hidden="true" />
            <div className="sq-banner-text">
              <h2>Pertanyaan yang Sering Diajukan</h2>
              <p>
                Masih memiliki pertanyaan seputar cara melapor atau klaim barang? Temukan jawabannya di bawah ini.
              </p>
            </div>
          </div>

          <div className="sq-faq-grid">
            {faqs.map((faq) => {
              const isOpen = openFaq === faq.number
              return (
                <article
                  key={faq.number}
                  className={`sq-faq-item ${isOpen ? 'open' : ''}`}
                >
                  <div className="sq-faq-num">{faq.number}</div>
                  <div className="sq-faq-body">
                    <button
                      type="button"
                      className="sq-faq-trigger"
                      onClick={() => setOpenFaq(isOpen ? '' : faq.number)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.question}</span>
                      <img
                        src={isOpen ? '/figma/icon-faq-close.svg' : '/figma/icon-faq-plus.svg'}
                        alt=""
                        width="28"
                        height="28"
                      />
                    </button>
                    {isOpen && <p className="sq-faq-answer">{faq.answer}</p>}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* CLOSING CTA SECTION (Figma Node 37:505) */}
        <section className="sq-cta-banner">
          <img src="/figma/cta-wave.png" alt="" className="sq-banner-wave" aria-hidden="true" />
          <div className="sq-banner-dots" aria-hidden="true" />
          <div className="sq-banner-tint" aria-hidden="true" />
          <div className="sq-cta-content">
            <div className="sq-cta-logo">
              <img src="/figma/logo-cube.svg" alt="" width="44" height="50" />
            </div>
            <h2>Ada Barang yang Menunggu untuk Ditemukan.</h2>
            <p>
              Bergabunglah bersama komunitas mahasiswa Universitas Klabat. Masuk ke akun Anda untuk mulai mencari atau melaporkan barang hari ini.
            </p>
            <Link to={portalHref} className="sq-btn sq-btn-lime">
              {user ? 'Buka Dashboard Anda' : 'Masuk ke Akun Anda'}
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER SECTION (Figma Node 39:261) */}
      <footer className="sq-footer">
        <div className="sq-footer-inner">
          <div className="sq-footer-top">
            <BrandLogo to="/" ariaLabel="Beranda Lost and Found UNKLAB" />

            <nav className="sq-footer-nav" aria-label="Navigasi Footer">
              <a href="#beranda">Beranda</a>
              <a href="#layanan">Layanan</a>
              <a href="#laporan">Laporan</a>
              <a href="#cara-kerja">Cara Kerja</a>
              <a href="#keunggulan">Keunggulan</a>
              <a href="#faq">FAQ</a>
              <Link to="/login">Masuk</Link>
            </nav>

            <div className="sq-footer-social">
              <span>Komunitas Kampus</span>
              <div className="sq-social-buttons">
                <Link to="/login" className="sq-social-btn" aria-label="Portal Mahasiswa UNKLAB">
                  <img src="/figma/icon-social-1.svg" alt="" width="22" height="22" />
                </Link>
                <a href="#laporan" className="sq-social-btn" aria-label="Jelajahi Laporan Terkini">
                  <img src="/figma/icon-social-2.svg" alt="" width="22" height="22" />
                </a>
                <a href="#cara-kerja" className="sq-social-btn" aria-label="Panduan Cara Kerja">
                  <img src="/figma/icon-social-3.svg" alt="" width="22" height="22" />
                </a>
              </div>
            </div>
          </div>

          <div className="sq-footer-divider" />

          <div className="sq-footer-bottom">
            <div className="sq-footer-contacts">
              <div className="sq-contact-pill">
                <img src="/figma/icon-mail.svg" alt="" width="22" height="22" />
                <span>student@unklab.ac.id</span>
              </div>
              <div className="sq-contact-pill">
                <img src="/figma/icon-phone.svg" alt="" width="22" height="22" />
                <span>Senin – Jumat · Jam Kampus</span>
              </div>
              <div className="sq-contact-pill">
                <img src="/figma/icon-location.svg" alt="" width="22" height="22" />
                <span>Kampus Universitas Klabat, Airmadidi</span>
              </div>
            </div>
            <p className="sq-copyright">
              © 2026 Lost and Found UNKLAB. Menemukan jalan pulang.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
