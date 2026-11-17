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
app.get('/api/reports/public', (_req, res) => {
  const reports = db
    .prepare(
      'SELECT id, type, title, category, location, description, status, reported_at FROM reports ORDER BY reported_at DESC LIMIT 4'
    )
    .all()
  res.json({ reports })
})
app.get('/api/reports', authenticate, (_req, res) => res.json({ reports: db.prepare('SELECT id, owner_id, type, title, category, location, description, status, reported_at FROM reports ORDER BY reported_at DESC').all() }))
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
    report: { id: Number(result.lastInsertRowid), owner_id: req.userId, type, title, category, location, description, status, reported_at: reportedAt, image_url: imageUrl },
  })
})
app.get('/api/reports/:id', authenticate, (req, res) => {
  const report = db.prepare(`SELECT r.id, r.owner_id, r.type, r.title, r.category, r.location, r.description,
    r.status, r.reported_at, r.image_url, u.name AS owner_name
    FROM reports r JOIN users u ON r.owner_id = u.id WHERE r.id = ?`).get(req.params.id)
  if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan.' })
  return res.json({ report })
})
app.get('/api/activities', authenticate, (_req, res) => {
  const activities = db
    .prepare(
      `SELECT 'report' AS activity_type, id, title, type AS item_type, location, status, reported_at AS created_at
       FROM reports
       UNION ALL
       SELECT 'claim' AS activity_type, c.id, r.title, 'Claim' AS item_type, r.location, c.status, c.submitted_at AS created_at
       FROM claims c
       JOIN reports r ON c.report_id = r.id
       ORDER BY created_at DESC
       LIMIT 6`
    )
    .all()
  res.json({ activities })
})

// KLAIM BARANG TEMUAN (Task 4). Kolom `message` adalah bukti kepemilikan rahasia:
// hanya dikembalikan kepada pengaju klaim lewat /api/claims/my, tidak pernah lewat /api/reports.
const CLOSED_REPORT_STATUSES = ['Sudah dikembalikan', 'Dibatalkan / Ditutup']
const insertClaim = db.transaction((reportId, claimantId, message) => {
  const result = db.prepare("INSERT INTO claims (report_id, claimant_id, message, status) VALUES (?, ?, ?, 'pending')").run(reportId, claimantId, message)
  db.prepare("UPDATE reports SET status = 'Sedang diklaim' WHERE id = ? AND status = 'Menunggu pemilik'").run(reportId)
  return result.lastInsertRowid
})
app.post('/api/claims', authenticate, (req, res) => {
  const { report_id, message } = req.body ?? {}
  const reportId = Number(report_id)
  const proof = typeof message === 'string' ? message.trim() : ''
  if (!Number.isInteger(reportId) || reportId <= 0) return res.status(400).json({ error: 'Laporan yang ingin diklaim wajib dipilih.' })
  if (proof.length < 10) return res.status(400).json({ error: 'Bukti kepemilikan wajib diisi minimal 10 karakter.' })
  if (proof.length > 1000) return res.status(400).json({ error: 'Bukti kepemilikan maksimal 1000 karakter.' })
  const report = db.prepare('SELECT id, owner_id, type, status FROM reports WHERE id = ?').get(reportId)
  if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan.' })
  if (report.type !== 'Found') return res.status(400).json({ error: 'Hanya barang temuan (Found) yang dapat diklaim.' })
  if (report.owner_id === req.userId) return res.status(403).json({ error: 'Anda tidak dapat mengklaim barang yang Anda laporkan sendiri.' })
  if (CLOSED_REPORT_STATUSES.includes(report.status)) return res.status(409).json({ error: 'Laporan ini sudah ditutup dan tidak dapat diklaim lagi.' })
  if (db.prepare("SELECT id FROM claims WHERE report_id = ? AND claimant_id = ? AND status = 'pending'").get(reportId, req.userId)) return res.status(409).json({ error: 'Anda sudah mengajukan klaim untuk barang ini. Klaim masih menunggu verifikasi.' })
  res.status(201).json({ claim: { id: insertClaim(reportId, req.userId, proof), status: 'pending' } })
})
app.get('/api/claims/my', authenticate, (req, res) => res.json({ claims: db.prepare(`
  SELECT c.id, c.report_id, c.status, c.submitted_at, c.message,
         r.title AS report_title, r.category AS report_category, r.location AS report_location
  FROM claims c
  JOIN reports r ON c.report_id = r.id
  WHERE c.claimant_id = ?
  ORDER BY c.submitted_at DESC, c.id DESC
`).all(req.userId) }))
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error: 'Terjadi gangguan pada server. Silakan coba lagi.' }) })
app.listen(3001, () => console.log('Lost & Found API at http://localhost:3001'))
