import { useEffect, useRef, useState } from 'react'
import { Link, navigate } from '../../router.jsx'
import NotificationBell from '../notifications/NotificationBell.jsx'
import BrandLogo from './BrandLogo.jsx'

const LINKS = [
  { key: 'dashboard', to: '/app', label: 'Dashboard' },
  { key: 'my-reports', to: '/app/my-reports', label: 'Laporan Saya' },
  { key: 'my-claims', to: '/app/my-claims', label: 'Klaim Saya' },
  { key: 'matching', to: '/app/matching', label: 'Matching' },
  { key: 'notifications', to: '/app/notifications', label: 'Notifikasi' },
  { key: 'profile', to: '/app/profile', label: 'Profil' },
]

/**
 * Navbar area mahasiswa: tautan utama, pencarian cepat global, lonceng notifikasi, chip profil, dan tombol keluar.
 * Di bawah 1100px tautan dipindah ke panel "Menu" agar header tidak melebar di mobile.
 */
export default function AppNavbar({ user, onLogout, active }) {
  const [open, setOpen] = useState(false)
  const [quickSearch, setQuickSearch] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('q') || ''
    } catch {
      return ''
    }
  })
  const headerRef = useRef(null)
  const initials = (user?.name || 'Mahasiswa')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0].toUpperCase())
    .join('')

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const onClick = (e) => !headerRef.current?.contains(e.target) && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const submitQuickSearch = (e) => {
    e.preventDefault()
    const trimmed = quickSearch.trim()
    setOpen(false)
    if (trimmed) {
      navigate(`/app?q=${encodeURIComponent(trimmed)}`)
    } else {
      navigate('/app')
    }
  }

  return (
    <header className="sq-navbar" ref={headerRef}>
      <div className="sq-navbar-inner sq-app-navbar">
        <BrandLogo to="/app" ariaLabel="Dashboard Lost and Found UNKLAB" />

        <nav id="sq-app-nav" className={`sq-app-nav${open ? ' open' : ''}`} aria-label="Navigasi mahasiswa">
          {LINKS.map((link) => (
            <Link
              key={link.key}
              to={link.to}
              className={`sq-nav-item${active === link.key ? ' active' : ''}${
                link.key === 'notifications' || link.key === 'profile' ? ' sq-nav-item-menu-only' : ''
              }`}
              aria-current={active === link.key ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <form className="sq-nav-quick-search sq-nav-item-menu-only" role="search" onSubmit={submitQuickSearch}>
            <input
              type="search"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Cari barang di kampus…"
              aria-label="Cari barang di kampus"
            />
          </form>
          <button type="button" className="sq-nav-item sq-nav-item-menu-only sq-nav-logout" onClick={onLogout}>
            Keluar ↗
          </button>
        </nav>

        <div className="sq-account-bar">
          <form className="sq-nav-search-form" role="search" onSubmit={submitQuickSearch}>
            <input
              type="search"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Cari barang…"
              aria-label="Pencarian cepat barang"
            />
          </form>
          <NotificationBell active={active === 'notifications'} />
          <Link
            to="/app/profile"
            className={`sq-user-chip sq-user-chip-link${active === 'profile' ? ' active' : ''}`}
            aria-label={`Profil ${user.name}`}
            aria-current={active === 'profile' ? 'page' : undefined}
          >
            <span className="sq-avatar">{initials}</span>
            <span className="sq-user-meta">
              <b>{user.name}</b>
              <small>Profil Mahasiswa</small>
            </span>
          </Link>
          <button type="button" className="sq-btn sq-btn-outline sq-logout-btn" onClick={onLogout}>
            Keluar ↗
          </button>
          <button
            type="button"
            className="sq-menu-toggle"
            aria-expanded={open}
            aria-controls="sq-app-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sq-menu-icon" aria-hidden="true" />
            {open ? 'Tutup' : 'Menu'}
          </button>
        </div>
      </div>
    </header>
  )
}
