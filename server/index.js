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
app.post('/api/reports', authenticate, (req, res) => {
  const body = req.body ?? {}
  const text = (value) => (typeof value === 'string' ? value.trim() : '')
  const type = text(body.type)
  const title = text(body.title)
  const category = text(body.category)
  const location = text(body.location)
  const description = text(body.description)
  const imageUrl = text(body.image_url) || null

  if (type !== 'Lost' && type !== 'Found') return res.status(400).json({ error: 'Tipe laporan harus "Lost" atau "Found".' })
  if (!title) return res.status(400).json({ error: 'Nama barang wajib diisi.' })
  if (title.length > 120) return res.status(400).json({ error: 'Nama barang maksimal 120 karakter.' })
  if (!category) return res.status(400).json({ error: 'Kategori wajib dipilih.' })
  if (!location) return res.status(400).json({ error: 'Lokasi di kampus wajib diisi.' })
  if (!description) return res.status(400).json({ error: 'Deskripsi barang wajib diisi.' })
  if (description.length > 1000) return res.status(400).json({ error: 'Deskripsi maksimal 1000 karakter.' })
  if (imageUrl && !/^https?:\/\/\S+$/i.test(imageUrl)) return res.status(400).json({ error: 'URL foto harus diawali http:// atau https://.' })

  let reportedAt = new Date().toISOString().slice(0, 19)
  if (text(body.reported_at)) {
    const parsed = new Date(text(body.reported_at))
    if (Number.isNaN(parsed.getTime())) return res.status(400).json({ error: 'Tanggal kejadian tidak valid.' })
    if (parsed.getTime() > Date.now() + 86400000) return res.status(400).json({ error: 'Tanggal kejadian tidak boleh di masa depan.' })
    reportedAt = text(body.reported_at)
  }

  const status = type === 'Lost' ? 'Masih dicari' : 'Menunggu pemilik'
  const result = db
    .prepare('INSERT INTO reports (owner_id, type, title, category, location, description, status, reported_at, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(req.userId, type, title, category, location, description, status, reportedAt, imageUrl)

  res.status(201).json({
    report: { id: Number(result.lastInsertRowid), type, title, category, location, description, status, reported_at: reportedAt, image_url: imageUrl },
  })
})
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error: 'Terjadi gangguan pada server. Silakan coba lagi.' }) })
app.listen(3001, () => console.log('Lost & Found API at http://localhost:3001'))
