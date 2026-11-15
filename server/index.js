import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import express from 'express'
import db from './db.js'

const app = express(); const sessions = new Map()
app.use(express.json()); app.use(cookieParser())
const getUser = (id) => db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id)
function authenticate(req, res, next) { const session = sessions.get(req.cookies.lf_session); if (!session || session.expires < Date.now()) return res.status(401).json({ error: 'Sesi Anda telah berakhir. Silakan masuk kembali.' }); req.userId = session.userId; next() }
app.post('/api/auth/login', async (req, res) => {
  const { email = '', password = '' } = req.body ?? {}
  if (!email.trim() || !password) return res.status(400).json({ error: 'Email dan password wajib diisi.' })
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase())
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Email atau password tidak tepat.' })
  const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, { userId: user.id, expires: Date.now() + 28800000 })
  res.cookie('lf_session', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 28800000 }).json({ user: getUser(user.id) })
})
app.post('/api/auth/logout', (req, res) => { sessions.delete(req.cookies.lf_session); res.clearCookie('lf_session').status(204).end() })
app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: getUser(req.userId) }))
app.get('/api/reports', authenticate, (_req, res) => res.json({ reports: db.prepare('SELECT id, type, title, category, location, description, status, reported_at FROM reports ORDER BY reported_at DESC').all() }))
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error: 'Terjadi gangguan pada server. Silakan coba lagi.' }) })
app.listen(3001, () => console.log('Lost & Found API at http://localhost:3001'))
