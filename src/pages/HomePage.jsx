import { useMemo, useState } from 'react'
import Icon from '../components/icons/Icon.jsx'
import Sidebar from '../components/layout/Sidebar.jsx'
import Topbar from '../components/layout/Topbar.jsx'
import StatCard from '../components/home/StatCard.jsx'
import ReportCard from '../components/home/ReportCard.jsx'
import ActivityList from '../components/home/ActivityList.jsx'
import { activity, recentReports, reportStats } from '../data/mockReports.js'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('Semua laporan')
  const [menuOpen, setMenuOpen] = useState(false)
  const filteredReports = useMemo(() => recentReports.filter((report) => {
    const matchesQuery = `${report.title} ${report.category} ${report.location}`.toLowerCase().includes(query.toLowerCase())
    const matchesType = type === 'Semua laporan' || report.type === type
    return matchesQuery && matchesType
  }), [query, type])

  return <div className="app-shell"><Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} /><main className="main-content"><Topbar onMenu={() => setMenuOpen(true)} /><div className="page-content"><section className="welcome"><div><p className="eyebrow">KAMIS, 13 NOVEMBER 2026</p><h1>Selamat datang kembali, Yoel <span>✦</span></h1><p className="welcome-copy">Mari bantu temukan barang yang hilang di sekitar kampus.</p></div><button className="primary-button"><Icon name="plus" size={18} /> Buat laporan</button></section><section className="hero-panel"><div><p className="eyebrow">KOMUNITAS UNKLAB</p><h2>Temukan kembali<br /><em>yang berarti.</em></h2><p>Satu tempat untuk melaporkan, mencari, dan mengembalikan barang di lingkungan kampus.</p><button className="hero-link">Jelajahi laporan <Icon name="chevron" size={16} /></button></div><div className="hero-orbit"><div className="orbit-dot dot-one">⌁</div><div className="orbit-dot dot-two">+</div><div className="orbit-dot dot-three">▣</div><div className="orbit-core">L<span>&</span>F</div></div></section><section className="stats-grid" aria-label="Ringkasan laporan">{reportStats.map((stat) => <StatCard key={stat.label} {...stat} />)}</section><section className="content-grid"><div className="reports-section"><div className="section-heading"><div><p className="eyebrow">AKTIVITAS TERBARU</p><h2>Laporan terbaru</h2></div><a href="#semua-laporan">Lihat semua <Icon name="chevron" size={15} /></a></div><div className="toolbar"><label className="search-field"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari barang atau lokasi..." aria-label="Cari barang atau lokasi" /></label><select value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter tipe laporan"><option>Semua laporan</option><option>Lost</option><option>Found</option></select></div><div className="reports-list">{filteredReports.length ? filteredReports.map((report) => <ReportCard key={report.id} report={report} />) : <div className="empty-state"><strong>Laporan tidak ditemukan</strong><span>Coba gunakan kata kunci atau filter lain.</span></div>}</div></div><aside className="activity-section"><div className="section-heading"><div><p className="eyebrow">JEJAK KOMUNITAS</p><h2>Recent activity</h2></div><button className="more-button" aria-label="Lihat aktivitas lainnya">•••</button></div><ActivityList items={activity} /><div className="tip-card"><span>✦</span><div><strong>Jadilah bagian dari solusi</strong><p>Menemukan sesuatu? Laporkan agar pemiliknya bisa segera kembali.</p><a href="#buat-laporan">Buat laporan <Icon name="chevron" size={14} /></a></div></div></aside></section></div></main></div>
}
