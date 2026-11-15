import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(root, 'data')
fs.mkdirSync(dataDir, { recursive: true })
const db = new Database(path.join(dataDir, 'lost-and-found.db'))
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL, type TEXT NOT NULL CHECK(type IN ('Lost','Found')), title TEXT NOT NULL, category TEXT NOT NULL, location TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL, reported_at TEXT NOT NULL, image_url TEXT, FOREIGN KEY(owner_id) REFERENCES users(id));
  CREATE TABLE IF NOT EXISTS claims (id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER NOT NULL, claimant_id INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(report_id) REFERENCES reports(id), FOREIGN KEY(claimant_id) REFERENCES users(id));
`)

const email = 'student@unklab.ac.id'
let student = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
if (!student) {
  const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run('Yoel Antariksa', email, bcrypt.hashSync('unklab123', 12))
  student = { id: result.lastInsertRowid }
}
if (!db.prepare('SELECT id FROM reports LIMIT 1').get()) {
  const add = db.prepare('INSERT INTO reports (owner_id, type, title, category, location, description, status, reported_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  for (const report of [
    ['Lost', 'Dompet kulit cokelat', 'Aksesori', 'Student Center', 'Dompet dengan kartu mahasiswa.', 'Masih dicari', '2026-11-13T09:20:00'],
    ['Found', 'AirPods putih', 'Elektronik', 'Perpustakaan UNKLAB', 'Ditemukan dekat area baca lantai dua.', 'Menunggu pemilik', '2026-11-13T08:00:00'],
    ['Lost', 'Kunci motor Honda', 'Kunci', 'Parkiran Fakultas', 'Gantungan kunci biru kecil.', 'Masih dicari', '2026-11-12T15:30:00'],
    ['Found', 'Tumbler hijau', 'Perlengkapan', 'Cafeteria', 'Tumbler tanpa nama di meja dekat kasir.', 'Menunggu pemilik', '2026-11-12T11:15:00'],
  ]) add.run(student.id, ...report)
}
export default db
