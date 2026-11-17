import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import bcrypt from 'bcryptjs'

const require = createRequire(import.meta.url)
const root = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(root, 'data')
fs.mkdirSync(dataDir, { recursive: true })
const dbPath = path.join(dataDir, 'lost-and-found.db')

function getDatabase() {
  try {
    const Database = require('better-sqlite3')
    const instance = new Database(dbPath)
    if (typeof instance.pragma === 'function') {
      instance.pragma('foreign_keys = ON')
    }
    return instance
  } catch (err) {
    console.warn(`[db] better-sqlite3 tidak dapat dimuat (${err.code || err.message}). Menggunakan driver native Node.js (node:sqlite)...`)
    const { DatabaseSync } = require('node:sqlite')
    const instance = new DatabaseSync(dbPath)
    instance.exec('PRAGMA foreign_keys = ON')
    if (!instance.pragma) {
      instance.pragma = (str) => instance.exec(`PRAGMA ${str}`)
    }
    return instance
  }
}

const db = getDatabase()

db.exec(`
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL, type TEXT NOT NULL CHECK(type IN ('Lost','Found')), title TEXT NOT NULL, category TEXT NOT NULL, location TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL, reported_at TEXT NOT NULL, image_url TEXT, FOREIGN KEY(owner_id) REFERENCES users(id));
  CREATE TABLE IF NOT EXISTS claims (id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER NOT NULL, claimant_id INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(report_id) REFERENCES reports(id), FOREIGN KEY(claimant_id) REFERENCES users(id));
`)

// Migrasi aman: kolom bukti kepemilikan klaim (rahasia, hanya untuk verifikasi).
try {
  db.exec(`ALTER TABLE claims ADD COLUMN message TEXT DEFAULT ''`)
} catch (_e) {
  // Kolom sudah ada
}

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

// Akun demo kedua + barang temuan miliknya, supaya alur klaim bisa dicoba:
// mahasiswa tidak dapat mengklaim laporan yang ia buat sendiri.
const finderEmail = 'student2@unklab.ac.id'
if (!db.prepare('SELECT id FROM users WHERE email = ?').get(finderEmail)) {
  const finder = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run('Grace Mandagi', finderEmail, bcrypt.hashSync('unklab123', 12))
  const add = db.prepare('INSERT INTO reports (owner_id, type, title, category, location, description, status, reported_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  for (const report of [
    ['Found', 'Kalkulator Casio abu-abu', 'Elektronik', 'GK2 Lantai 1', 'Ditemukan di meja belakang setelah kelas sore.', 'Menunggu pemilik', '2026-11-14T16:40:00'],
    ['Found', 'Jaket hoodie hitam', 'Pakaian', 'Student Center', 'Tertinggal di kursi dekat pintu masuk.', 'Menunggu pemilik', '2026-11-14T10:05:00'],
  ]) add.run(finder.lastInsertRowid, ...report)
}
export default db
