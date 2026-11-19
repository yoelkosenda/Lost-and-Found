import { lazy, Suspense, useEffect, useState } from 'react'
import { api } from './lib/api.js'
import { showToast } from './lib/toast.js'
import { Link, navigate } from './router.jsx'
import ToastHost from './components/layout/ToastHost.jsx'

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const CreateReportPage = lazy(() => import('./pages/CreateReportPage.jsx'))
const MyClaimsPage = lazy(() => import('./pages/MyClaimsPage.jsx'))
const MyReportsPage = lazy(() => import('./pages/MyReportsPage.jsx'))
const ReportDetailPage = lazy(() => import('./pages/ReportDetailPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'))
const MatchingPage = lazy(() => import('./pages/MatchingPage.jsx'))
const ClaimDetailPage = lazy(() => import('./pages/ClaimDetailPage.jsx'))

export default function App() {
  const [locationState, setLocationState] = useState(() => ({
    path: window.location.pathname,
    search: window.location.search,
  }))
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const change = () =>
      setLocationState({
        path: window.location.pathname,
        search: window.location.search,
      })
    window.addEventListener('popstate', change)
    return () => window.removeEventListener('popstate', change)
  }, [])

  useEffect(() => {
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
  }, [])

  async function login(email, password) {
    const { user } = await api.login(email, password)
    setUser(user)
    showToast(`Selamat datang kembali, ${user.name.split(' ')[0]}!`, 'success')
    navigate('/app')
  }

  async function register(formData) {
    const { user } = await api.register(formData)
    setUser(user)
    showToast(`Akun mahasiswa berhasil dibuat. Selamat datang, ${user.name.split(' ')[0]}!`, 'success')
    navigate('/app')
  }

  async function logout() {
    await api.logout()
    setUser(null)
    showToast('Anda telah keluar dari sesi mahasiswa.', 'info')
    navigate('/')
  }

  if (user === undefined) return <div className="boot">Memuat Lost and Found UNKLAB…</div>

  const { path, search } = locationState

  function renderPage() {
    const reportDetailMatch = path.match(/^\/app\/reports\/(\d+)$/)
    if (reportDetailMatch) {
      return user ? (
        <ReportDetailPage id={reportDetailMatch[1]} user={user} onLogout={logout} />
      ) : (
        <Redirect to="/login" />
      )
    }

    const claimDetailMatch = path.match(/^\/app\/claims\/(\d+)$/)
    if (claimDetailMatch) {
      return user ? (
        <ClaimDetailPage id={claimDetailMatch[1]} user={user} onLogout={logout} />
      ) : (
        <Redirect to="/login" />
      )
    }

    if (path === '/app') {
      return user ? <DashboardPage user={user} onLogout={logout} search={search} /> : <Redirect to="/login" />
    }
    if (path === '/app/reports/new') {
      return user ? <CreateReportPage user={user} onLogout={logout} search={search} /> : <Redirect to="/login" />
    }
    if (path === '/app/my-reports') {
      return user ? <MyReportsPage user={user} onLogout={logout} /> : <Redirect to="/login" />
    }
    if (path === '/app/my-claims') {
      return user ? <MyClaimsPage user={user} onLogout={logout} /> : <Redirect to="/login" />
    }
    if (path === '/app/profile') {
      return user ? (
        <ProfilePage user={user} onLogout={logout} onUserChange={setUser} />
      ) : (
        <Redirect to="/login" />
      )
    }
    if (path === '/app/notifications') {
      return user ? <NotificationsPage user={user} onLogout={logout} /> : <Redirect to="/login" />
    }
    if (path === '/app/matching') {
      return user ? <MatchingPage user={user} onLogout={logout} /> : <Redirect to="/login" />
    }
    if (path === '/login' || path === '/register') {
      const initialMode =
        path === '/register' || new URLSearchParams(search).get('mode') === 'register'
          ? 'register'
          : 'login'
      return user ? (
        <Redirect to="/app" />
      ) : (
        <LoginPage onLogin={login} onRegister={register} initialMode={initialMode} />
      )
    }
    if (path === '/') {
      return <LandingPage user={user} />
    }
    return <NotFoundPage user={user} />
  }

  return (
    <>
      <Suspense fallback={<div className="boot">Memuat halaman…</div>}>{renderPage()}</Suspense>
      <ToastHost />
    </>
  )
}

function Redirect({ to }) {
  useEffect(() => navigate(to), [to])
  return <div className="boot">Mengalihkan…</div>
}

function NotFoundPage({ user }) {
  return (
    <div className="sq-page">
      <main className="sq-container" style={{ paddingTop: '64px', paddingBottom: '64px' }}>
        <section className="sq-section" style={{ padding: '64px 32px', textAlign: 'center' }}>
          <span className="sq-kicker-pill">404 · HALAMAN TIDAK DITEMUKAN</span>
          <h1 style={{ marginTop: '14px', fontSize: '36px' }}>Sepertinya halaman ini ikut hilang.</h1>
          <p style={{ maxWidth: '520px', margin: '12px auto 28px', color: 'var(--grey-60)' }}>
            Alamat URL yang Anda tuju tidak tersedia di portal Lost and Found UNKLAB.
          </p>
          <div className="sq-hero-actions" style={{ justifyContent: 'center' }}>
            <Link to={user ? '/app' : '/'} className="sq-btn sq-btn-lime">
              {user ? 'Kembali ke Dashboard' : 'Kembali ke Beranda'}
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
