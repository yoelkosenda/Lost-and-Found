import { useEffect, useState } from 'react'
import { api } from './lib/api.js'
import { navigate } from './router.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import MyReportsPage from './pages/MyReportsPage.jsx'

export default function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [user, setUser] = useState(undefined)
  useEffect(() => { const change = () => setPath(window.location.pathname); window.addEventListener('popstate', change); return () => window.removeEventListener('popstate', change) }, [])
  useEffect(() => { api.me().then(({ user }) => setUser(user)).catch(() => setUser(null)) }, [])
  async function login(email, password) { const { user } = await api.login(email, password); setUser(user); navigate('/app') }
  async function logout() { await api.logout(); setUser(null); navigate('/') }
  if (user === undefined) return <div className="boot">Memuat Lost and Found UNKLAB…</div>
  if (path === '/app') return user ? <DashboardPage user={user} onLogout={logout} /> : <Redirect to="/login" />
  if (path === '/app/my-reports') return user ? <MyReportsPage user={user} onLogout={logout} /> : <Redirect to="/login" />
  if (path === '/login') return user ? <Redirect to="/app" /> : <LoginPage onLogin={login} />
  return <LandingPage />
}
function Redirect({ to }) { useEffect(() => navigate(to), [to]); return <div className="boot">Mengalihkan…</div> }
