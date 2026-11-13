import Icon from '../icons/Icon.jsx'

const links = [
  { label: 'Beranda', icon: 'grid', active: true },
  { label: 'Barang Hilang', icon: 'search' },
  { label: 'Barang Ditemukan', icon: 'filter' },
  { label: 'Laporan Saya', icon: 'bell' },
]

export default function Sidebar({ open, onClose }) {
  return <>
    <button className={`sidebar-backdrop ${open ? 'is-visible' : ''}`} aria-label="Tutup menu" onClick={onClose} />
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="brand"><span className="brand-mark">L<span>&</span>F</span><span className="brand-name">lost & found<small>UNKLAB community</small></span></div>
      <div className="sidebar-label">Menu utama</div>
      <nav aria-label="Navigasi utama">
        {links.map((link) => <a className={`nav-link ${link.active ? 'active' : ''}`} href={`#${link.label.toLowerCase().replaceAll(' ', '-')}`} key={link.label} onClick={onClose}><Icon name={link.icon} /><span>{link.label}</span>{link.active && <i />}</a>)}
      </nav>
      <div className="sidebar-label sidebar-label-bottom">Bantuan</div>
      <a className="nav-link" href="#panduan" onClick={onClose}><span className="help-dot">?</span><span>Panduan penggunaan</span></a>
      <div className="sidebar-account"><div className="avatar">YA</div><div><strong>Yoel Antariksa</strong><span>Mahasiswa</span></div><button aria-label="Keluar"><Icon name="logout" size={17} /></button></div>
    </aside>
  </>
}
